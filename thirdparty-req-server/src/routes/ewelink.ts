import { Router } from 'express'
import { eWeLinkLogin, getEWeLinkFamily, getEWeLinkThings } from '../services/ewelink.ts';
import { saveEWeLinkCred } from '../db/index.ts';
import { config } from '../config.ts';

export const eWeLinkRouter = Router()

// ewelink login（web 只传账号，签名 + appid 由服务端处理）
eWeLinkRouter.post('/api/user/login', async (req, res, next) => {
    try {
        const { account } = req.body ?? {};
        if (!account) return res.json({ error: 401, data: {}, msg: 'require account' });
        const { data, error } = await eWeLinkLogin(account) as unknown as {data: any, error: string};
        res.json({ error, data, msg: 'success' });
        if (data?.at && data?.user?.apikey) {
            saveEWeLinkCred(data.at, data.user.apikey, config.appId);
        }
    } catch (err) {
        next(err);
    }
})

// ewelink family
eWeLinkRouter.get('/api/family', async (req, res, next) => {
    try {
        const at = req.get('Authorization')!;
        const { data } = await getEWeLinkFamily(at);
        res.json({ error: 0, data, msg: 'success' });
    } catch (err) {
        next(err);
    }
})

// ewelink thing
eWeLinkRouter.get(`/api/device/thing`, async (req, res, next) => {
    try {
        const { familyid } = req.query;
        const at = req.get('Authorization')!;
        const { data } = await getEWeLinkThings(String(familyid), at);
        res.json({ error: 0, data, msg: 'success' });
    } catch (err) {
        next(err);
    }
})
