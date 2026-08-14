// SSE 连接管理
import type { Response } from 'express'

// 管理 SSE 连接池
// const clientsMap = new Map<string, Set<Response>>();
const clients = new Set<Response>();
export function addSseClient(res: Response) {
  // clientsMap.get(user)?.add(res);
  clients.add(res);
}

export function removeSseClient(res: Response) {
  // clientsMap.get(user)?.delete(res)
  clients.delete(res);
}

// 推送 SSE 事件
export function pushSse( event: string, data: unknown) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
  // const client = clientsMap.get(user);
  // if(!client) return
  for (const res of clients) {
    res.write(payload)
  }
}
