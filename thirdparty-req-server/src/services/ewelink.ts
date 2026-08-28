import axios from 'axios'
import { createHmac } from 'node:crypto'
import { config } from '../config.ts'

type Account = {
    countryCode: string,
    phoneNumber: string,
    password: string,
}

// ewelink API http
const http = axios.create({
    timeout: 5000,
    baseURL: 'https://cn-apia.coolkit.cn'
})

http.interceptors.response.use((response) => response.data);

// ewelink login
export const eWeLinkLogin = (account: Account) => {
    const sign = createHmac('sha256', config.appSecret).update(JSON.stringify(account)).digest('base64')
    return http.post('/v2/user/login', account, {
        headers: {
            "Content-Type": 'application/json',
            "Authorization": `Sign ${sign}`,
            "X-CK-Appid": config.appId,
        }
    })
}

// ewelink family
export const getEWeLinkFamily = (at: string) => {
    return http.get('/v2/family', {
        headers: {
            "Content-Type": 'application/json',
            "Authorization": `${at}`,
            "X-CK-Appid": config.appId,
        }
    })
}

// ewelink things
export const getEWeLinkThings = (familyid: string, at: string) => {
    return http.get(`/v2/device/thing?familyid=${familyid}`, {
        headers: {
            "Content-Type": 'application/json',
            "Authorization": `${at}`,
            "X-CK-Appid": config.appId,
        }
    })
}
