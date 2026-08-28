import request from "@/request/request"
type Account = {
    countryCode: string,
    phoneNumber: string,
    password: string,
}

// login
export const loginRequest = (account: Account) => {
    return request.post('/api/user/login',
        {
            account,
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
