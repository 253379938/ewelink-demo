import requestOpenApi from "@/request/requestOpenApi";


// 获取 open api at
export const getOpenApiAt = (iHost: string, password: string, app_name: string) => {
    return requestOpenApi.post('/open-api/access_token', {
        iHost,
        password,
        app_name,
    })
}

// thirdparty device
export const thirdpartyDevice = (eWeLinkEvent: any, at: string, iHost: string) => {
    return requestOpenApi.post('/open-api/thirdparty/event',
        {
            eWeLinkEvent, at, iHost,
        })
}

// update thirdparty device
export const updateThirdpartyDevice = (params: any, deviceId: string , at: string, iHost: string) => {
    return requestOpenApi.post('/open-api/device',
        {
            params, deviceId, at, iHost,
        })
}

// 查询设备同步映射
export const getThirdpartyMap = ( iHost: string, at: string) => {
    return requestOpenApi.post('/open-api/thirdparty-map',
        {
        iHost,  at
        })
}
