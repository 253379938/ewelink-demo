import { Router } from 'express'
import { eWeLinkLogin, getEWeLinkFamily, getEWeLinkThings } from '../services/ewelink.ts';
import { saveEWeLinkCred } from '../db/index.ts';

export const eWeLinkRouter = Router()

// ewelink login
eWeLinkRouter.post('/api/user/login', async (req, res, next) => {
    try {
        const { account } = req.body ?? {};
        const appid = req.get('X-CK-Appid');
        if (!appid) res.json({ error: 401, data: {}, msg: 'require appid' });
        const loginAt = req.get('Authorization')!;
        const { data } = await eWeLinkLogin(account, loginAt, appid!);
        res.json({ error: 0, data, msg: 'success' });
        saveEWeLinkCred(data.at, data.user.apikey, appid!);
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