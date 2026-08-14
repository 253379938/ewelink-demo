import { Router } from 'express'
import { thirdpartyRouter } from './thirdparty.ts'

// 注册路由
export const routes = Router()

routes.use(thirdpartyRouter)
