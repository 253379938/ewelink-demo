import axios from 'axios'
import type { IHostDevice } from '../type/devices.ts'

// iHost Open API http
const http = axios.create({
  timeout: 5000,
})

http.interceptors.response.use((response) => response.data);

// iHOST login
export async function loginIHost(iHost: string, password: string): Promise<any> {
  const url = new URL('/api/v1/rest/bridge/login', iHost)
  return http.post(url.toString(), {
    password,
  })
}
// iHost 发放 authorization
export async function authorization(iHost: string, at: string): Promise<any> {
  const url = new URL('/api/v1/rest/bridge/openapi/authorization', iHost)
  return http.post(url.toString(), {
    type: 'openapi'
  }, {
    headers: {
      Authorization: `Bearer ${at}`
    }
  })
}

// 获取凭证 iHost At
export async function getAccessToken(iHost: string, password: string, app_name: string): Promise<any> {
  const url = new URL('/open-api/v2/rest/bridge/access_token', iHost)
  const data: any = await http.get(url.toString(), {
    params: {
      app_name,
    }
  })  
  // 触发 iHost 登录,同意发放凭证
  if (data.error === 401) {
    const res = await loginIHost(iHost, password);
    
    await authorization(iHost, res.data.at);
    // 授权完成后重新 GET 一次
    const retry: any =await http.get(url.toString(), {
    params: {
      app_name,
    }
  })  
    console.log('retry:', retry);
    console.log('iHost open at:', retry.data.token);
    return retry.data.token;
  }
  return data
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
              message_id: "Unique identifier, preferably a version 4 UUID",
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
              message_id: "Unique identifier, preferably a version 4 UUID",
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

