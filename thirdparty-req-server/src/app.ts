import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import express from 'express'
import { routes } from './routes/index.ts'
import { errorHandler, notFound } from './middleware/error.ts'

// dist 路径
const distDir = join(import.meta.dirname, '../public')

let indexHtml = ''
try {
  indexHtml = readFileSync(join(distDir, 'index.html'), 'utf-8')
} catch {
}

export function createApp() {
  const app = express()

  app.use(express.json())

  // 设备同步 open-api router
  app.use(routes)

  app.use(express.static(distDir))

  // 非 API 的 GET 请求返回 index.html
  app.use((req, res, next) => {
    if (
      req.method !== 'GET' ||
      req.path.startsWith('/open-api') ||
      req.path.startsWith('/api') ||
      !indexHtml
    ) {
      return next()
    }
    res.type('html').send(indexHtml)
  })

  // 错误处理
  app.use(notFound)
  app.use(errorHandler)

  return app
}
