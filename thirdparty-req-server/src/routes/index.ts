import { Router } from 'express'
import { thirdpartyRouter } from './thirdparty.ts'
import { eWeLinkRouter } from './ewelink.ts'
// 注册路由
export const routes = Router()

routes.use(thirdpartyRouter, eWeLinkRouter)
