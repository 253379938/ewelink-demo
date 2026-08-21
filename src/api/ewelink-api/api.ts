import request from "@/request/request"
import { appid } from "@/constants"
type Account = {
    countryCode: string,
    phoneNumber: string,
    password: string,
}

// login
export const loginRequest = (account: Account, loginAt: string) => {
    return request.post('/api/user/login',
        {
            account,
        }, {
            headers: {
                'Authorization': `Sign ${loginAt}`,
                'Content-Type': 'application/json',
                "X-CK-Appid": appid
            }
        })
}

// family
export const getFamilys = () => {
    return request.get('/api/family',
         {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                'Content-Type': 'application/json'
            }
        })
}

// things
export const getThings = (familyId: string) => {
    return request.get(`/api/device/thing?familyid=${familyId}`,
         {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                'Content-Type': 'application/json'
            }
        })
}