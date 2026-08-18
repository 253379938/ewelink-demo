import requestOpenApi from "@/request/requestOpenApi";

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
export const thirdpartyDevice = (eWeLinkEvent: any) => {
    return requestOpenApi.post('/open-api/thirdparty/event',
        {
            eWeLinkEvent,
        })
}

// update thirdparty device
export const updateThirdpartyDevice = (params: any, deviceId: string) => {
    return requestOpenApi.post('/open-api/device',
        {
            params, deviceId,
        })
}

// 查询同步设备
export const getThirdpartyDevice = () => {
    return requestOpenApi.get('/open-api/devices')
}
