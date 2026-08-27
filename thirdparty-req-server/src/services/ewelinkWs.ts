// server < --- > eWeLink 云端 WS
import WebSocket from 'ws'
import axios from 'axios'
import { updateThirdpartyDevice } from './ihost.ts'

interface WsCreds {
  at: string
  apikey: string
  appid: string
}

let ws: WebSocket | null = null
let creds: WsCreds | null = null
let heartbeatTimer: ReturnType<typeof setInterval> | null = null
let pongTimeoutTimer: ReturnType<typeof setTimeout> | null = null

const pongTimeOut = 3000
const updateTimeout = 5000
const pendingMap = new Map<
  string,
  { resolve: (v: any) => void; reject: (e: Error) => void; timer: ReturnType<typeof setTimeout> }
>()

// 指数退避重连
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let retryCount = 0
let isReconnect = false
let manuallyClosed = false
const retryTimeOut = 3000
const maxRetryTimeOut = 30000

// 云端推送设备状态转发给 web
type StateHandler = (data: { action: string; deviceid: string; params: Record<string, any> }) => void
let stateHandler: StateHandler | null = null
export function onState(handler: StateHandler) {
  stateHandler = handler
}

// dispatch 分配 WS 地址
async function getWsUrl(): Promise<string> {
  const data = await axios.get('https://cn-dispa.coolkit.cn/dispatch/app')
  if (data.data.error == 0) {
    return `wss://${data.data.domain}:${data.data.port}/api/ws`
  }
  throw new Error('dispatch error')
}

// 握手：userOnline
function sendUserOnline() {
  if (!ws || !creds) return
  ws.send(
    JSON.stringify({
      action: 'userOnline',
      version: 8,
      at: creds.at,
      userAgent: 'app',
      ts: Math.floor(Date.now() / 1000),
      apikey: creds.apikey,
      appid: creds.appid,
      nonce: Math.random().toString(36).slice(2, 10),
      sequence: Date.now(),
    }),
  )
}

// 心跳
function startHeartbeat(config: { hb?: number; hbInterval?: number }) {
  stopHeartbeat()
  clearPongTimeout()
  if (config.hb === 1) {
    const interval = ((config.hbInterval || 90) - 7) * 1000
    heartbeatTimer = setInterval(() => {
      if (!ws) {
        stopHeartbeat()
        return
      }
      clearPongTimeout()
      ws.send('ping')
      pongTimeoutTimer = setTimeout(() => {
        ws?.close()
      }, pongTimeOut)
    }, interval)
  }
}

function stopHeartbeat() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer)
    heartbeatTimer = null
  }
}

function clearPongTimeout() {
  if (pongTimeoutTimer) {
    clearTimeout(pongTimeoutTimer)
    pongTimeoutTimer = null
  }
}

// 重连
function retryReconnect() {
  if (isReconnect) return
  retryCount++
  isReconnect = true
  const delay = Math.min(retryTimeOut * Math.pow(2, retryCount - 1), maxRetryTimeOut)
  reconnectTimer = setTimeout(async () => {
    isReconnect = false
    try {
      if (creds) await connect(creds)
    } catch {
      retryReconnect()
    }
  }, delay)
}

// 建立与云端的连接
export async function connect(credsIn: WsCreds): Promise<void> {
  if (ws?.readyState === WebSocket.OPEN) return
  creds = credsIn
  manuallyClosed = false
  const url = await getWsUrl()
  ws = new WebSocket(url)

  ws.on('open', () => {
    retryCount = 0
    sendUserOnline()
    console.log('ewelink ws connected')
  })

  ws.on('message', (data) => {
    const text = data.toString()
    if (text === 'pong') {
      clearPongTimeout()
      return
    }
    const msg = JSON.parse(text)
    // 返回 config 开启心跳
    if (msg.config) startHeartbeat(msg.config)
    // 控制命令响应
    if (msg.sequence !== undefined) {
      const item = pendingMap.get(String(msg.sequence))
      if (item) {
        clearTimeout(item.timer)
        pendingMap.delete(String(msg.sequence))
        item.resolve(msg)
      }
    }
    // eWeLink 云端推送状态转发给 web & 同步 iHost
    if (msg.action === 'update' && msg.deviceid && msg.params) {
      stateHandler?.({ action: 'update', deviceid: msg.deviceid, params: msg.params })
      try {
          updateThirdpartyDevice(msg)
      } catch(err) {
        throw new Error('update iHost err')
      }
    }
    if (msg.action === 'sysmsg') {
      stateHandler?.({ action:'sysmsg', deviceid: msg.deviceid, params: msg.params })
    }
  })

  ws.on('close', (code, reason) => {
    console.warn('ewelink ws closed, code:', code, 'reason:', reason.toString())
    stopHeartbeat()
    clearPongTimeout()
    ws = null
    // 非主动关闭才重连
    if (!manuallyClosed) retryReconnect()
  })

  ws.on('error', (err) => console.error('ewelink ws error', err))
}

// 发送 params 到 eWeLink 云端
export function sendUpdate(deviceid: string, params: Record<string, any>): Promise<any> {
  return new Promise((resolve, reject) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return reject(new Error('no eWeLink ws'))
    }
    if (!creds?.apikey) return reject(new Error('must have apikey'))
    const sequence = String(Date.now())
    const timer = setTimeout(() => {
      pendingMap.delete(sequence)
      reject(new Error('eWeLink update 超时'))
    }, updateTimeout)
    pendingMap.set(sequence, { resolve, reject, timer })
    ws.send(
      JSON.stringify({
        action: 'update',
        apikey: creds.apikey,
        deviceid,
        params,
        userAgent: 'app',
        sequence,
      }),
    )
  })
}

// 关闭连接（主动关闭，不触发重连）
export function close() {
  manuallyClosed = true
  if (reconnectTimer) clearTimeout(reconnectTimer)
  stopHeartbeat()
  clearPongTimeout()
  pendingMap.forEach((p) => clearTimeout(p.timer))
  pendingMap.clear()
  if (ws) {
    ws.close(1000, 'close')
    ws.terminate();
    ws = null
  }
}
