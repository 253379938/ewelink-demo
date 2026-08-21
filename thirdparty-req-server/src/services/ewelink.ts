import axios from 'axios'
import { getEWeLinkCred } from '../db/index.ts';

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
export const eWeLinkLogin = (account: Account, loginAt: string, appid: string) => {
    return http.post('/v2/user/login',
            account,
        {
            headers: {
                "Content-Type": 'application/json',
                "Authorization": `${loginAt}`,
                "X-CK-Appid": appid
            }
        })
}

// ewelink family
export const getEWeLinkFamily = (at: string) => {
    const cred = getEWeLinkCred();
    return http.get('/v2/family',
        {
            headers: {
                "Content-Type": 'application/json',
                "Authorization": `${at}`,
                "X-CK-Appid": cred?.appid
            }
        })
}

// ewelink things
export const getEWeLinkThings = (familyid: string, at: string) => {
    const cred = getEWeLinkCred();
    return http.get(`/v2/device/thing?familyid=${familyid}`,
        {
            headers: {
                "Content-Type": 'application/json',
                "Authorization": `${at}`,
                "X-CK-Appid": cred?.appid
            }
        })
}

