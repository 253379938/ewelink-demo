import requestOpenApi from "@/request/requestOpenApi";
import type { DeviceItemData } from "@/views/home/types";
// 获取 open api at（重新请求时取消上一次，避免 server 起多个轮询）
let getAtController: AbortController | null = null
export const getOpenApiAt = (iHost: string, app_name: string) => {
    getAtController?.abort()
    getAtController = new AbortController()
    return requestOpenApi.post('/open-api/access_token', {
        iHost,
        app_name,
    }, {
        timeout: 5 * 60 * 1000,
        signal: getAtController.signal,
    })
}

// thirdparty device
export const thirdpartyDevice = (eWeLinkEvent: DeviceItemData) => {
    return requestOpenApi.post('/open-api/thirdparty/event',
        {
            eWeLinkEvent,
        })
}

// 查询同步设备
export const getThirdpartyDevice = () => {
    return requestOpenApi.get('/open-api/devices')
}

// 取消同步设备
export const deleteThirdpartyDevice = (deviceId: string) => {
    return requestOpenApi.delete(`/open-api/device/${deviceId}`)
}