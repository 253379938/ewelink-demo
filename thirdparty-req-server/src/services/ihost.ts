import axios from 'axios'
import type { IHostDevice } from '../type/devices.ts'
import { v4 as uuidv4 } from 'uuid';
import { getIHostCred } from '../db/index.ts';
import type { Params } from '../type/params.ts';
import { buildEndpoint } from '../utils/buildEndpoint/index.ts';

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
    console.log(`iHost open token 第 ${attempt} 次轮询 error=${data?.error} 3s 后重试`)
    await new Promise((r) => setTimeout(r, 3000))
  }
  throw new Error('获取 iHost open token 超时')
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
export const updateThirdpartyDevice = async (params: Params) => {
  const iHostCred = getIHostCred();
  const url = new URL('/open-api/v2/rest/thirdparty/event', iHostCred?.url)

  const { data: { device_list } } = await getThirdpartyDevice(iHostCred?.at as string, iHostCred?.url as string);
  const device = device_list.filter((d: { [key: string]: any }) => d.third_serial_number === params.deviceid)[0] as Record<string, any>;
  if (!device || !device.model || device.model !== 'TRVZB') return
  const { name, payload } = buildEndpoint[device.model as keyof typeof buildEndpoint].getNameAndPayloadFromParams(params, device);
  if (!name || !payload) { return new Error('need name & payload, error: no support')}
  return http.post(url.toString(),
    {
      event: {
        header: {
          name,
          message_id: uuidv4(),
          version: "2"
        },
        endpoint: {
          serial_number: device.serial_number,
          third_serial_number: device.third_serial_number
        },
        payload,
      }
    }, {
    headers: {
      "Content-Type": 'application/json',
      "Authorization": `Bearer ${iHostCred?.at}`
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
