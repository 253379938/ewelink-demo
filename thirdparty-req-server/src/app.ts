import express from 'express'
import { routes } from './routes/index.ts'
import { errorHandler, notFound } from './middleware/error.ts'

export function createApp() {
  const app = express()

  app.use(express.json())

  // 设备同步 open-api router
  app.use(routes)

  // 错误处理
  app.use(notFound)
  app.use(errorHandler)

  return app
}
