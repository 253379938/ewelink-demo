import axios from 'axios'
import type { IHostDevice } from '../type/devices.ts'
import { v4 as uuidv4 } from 'uuid';

// iHost Open API http
const http = axios.create({
  timeout: 5000,
})

http.interceptors.response.use((response) => response.data);

// 获取凭证 iHost At
export async function getAccessToken(iHost: string, app_name: string, shouldAbort?: () => boolean): Promise<any> {
  const url = new URL('/open-api/v2/rest/bridge/access_token', iHost)
  // 轮询等待 iHost 授权;最多 100 次,5 分钟
  for (let attempt = 1; attempt <= 100; attempt++) {
    // 客户端断开/取消 中止轮询
    if (shouldAbort?.()) throw new Error('ABORTED')
    const data: any = await http.get(url.toString(), {
      params: { app_name },
    })
    const token = data?.data?.token
    if (data.error === 0 && token) {
      return token
    }
    console.log(`getAccessToken 第 ${attempt} 次轮询 error=${data?.error} 3s 后重试`)
    await new Promise((r) => setTimeout(r, 3000))
  }
  throw new Error('获取 iHost access_token 超时，请确认 iHost 已授权')
}

// iHost 设备列表
export async function getDevices(iHost: string, at: string): Promise<any> {
  const url = new URL('/open-api/v2/rest/devices', iHost)
  return http.get(url.toString(), {
    headers: {
      Authorization: `Bearer ${at}`
    }
  })
}

// 同步设备
export const thirdpartyDevice = (device: IHostDevice, at: string, iHost: string) => {
    const url = new URL('/open-api/v2/rest/thirdparty/event', iHost)
    return http.post(url.toString(),
        {
          event: {
            header: {
              name: "DiscoveryRequest",
              message_id: uuidv4(),
              version: "2"
            },
            payload: {
              endpoints: [device]
            }
            }
        }, {
        headers: {
            "Content-Type": 'application/json',
            "Authorization": `Bearer ${at}`
        }
    })
}

// 设备状态更新
export const updateThirdpartyDevice = (state: any, serial_number: string, third_serial_number:string, at: string, iHost: string) => {
    const url = new URL('/open-api/v2/rest/thirdparty/event', iHost)
    return http.post(url.toString(),
        {
          event: {
            header: {
              name: "DeviceStatesChangeReport",
              message_id: uuidv4(),
              version: "2"
            },
            endpoint: {
              serial_number,
              third_serial_number
            },
            payload: {
              state,
            },
            }
        }, {
        headers: {
            "Content-Type": 'application/json',
            "Authorization": `Bearer ${at}`
        }
    })
}

