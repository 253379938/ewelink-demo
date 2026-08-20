import axios from 'axios'
import type { IHostDevice } from '../type/devices.ts'
import { v4 as uuidv4 } from 'uuid';

interface ApiResponse<T = any> {
  error: number;
  message?: string;
  data?: T;
}

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
    if (shouldAbort?.()) throw new Error('aborted')
    const data = await http.get(url.toString(), {
      params: { app_name },
    }) as unknown as ApiResponse
    console.log(data);
    
    const token = data.data.token
    if (data.error === 0 && token) {
      return token
    }
    console.log(`getAccessToken 第 ${attempt} 次轮询 error=${data?.error} 3s 后重试`)
    await new Promise((r) => setTimeout(r, 3000))
  }
  throw new Error('获取 iHost access_token 超时，请确认 iHost 已授权')
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
export const updateThirdpartyDevice = (state: any, serial_number: string, third_serial_number:string, at: string, iHost: string, name: string) => {
  const url = new URL('/open-api/v2/rest/thirdparty/event', iHost)
  const payload = name === 'DeviceStatesChangeReport' ? { state } : { capabilities: state }
    return http.post(url.toString(),
        {
          event: {
            header: {
              name,
              message_id: uuidv4(),
              version: "2"
            },
            endpoint: {
              serial_number,
              third_serial_number
            },
            payload,
            }
        }, {
        headers: {
            "Content-Type": 'application/json',
            "Authorization": `Bearer ${at}`
        }
    })
}

// 查询同步设备
export const getThirdpartyDevice = (at: string, iHost: string) => {
  const url = new URL('/open-api/v2/rest/devices', iHost)
  return http.get(url.toString(),
    {
      headers: {
        "Content-Type": 'application/json',
        "Authorization": `Bearer ${at}`
      }
    })
}

// 删除同步设备
export const deleteThirdpartyDevice = (at: string, iHost: string, serial_number: string) => {
  const url = new URL(`/open-api/v1/rest/devices/${serial_number}`, iHost)
  return http.delete(url.toString(),
    {
      headers: {
        "Content-Type": 'application/json',
        "Authorization": `Bearer ${at}`
      }
    })
}
