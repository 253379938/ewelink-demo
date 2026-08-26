import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { env } from 'node:process'
import express from 'express'
import { routes } from './routes/index.ts'
import { errorHandler, notFound } from './middleware/error.ts'

// dist路径
const distDir = join(import.meta.dirname, '../../dist')

let indexHtml = ''
try {
  indexHtml = readFileSync(join(distDir, 'index.html'), 'utf-8')
} catch {
  
}

// 运行时注入 script 读取环境变量
function injectRuntimeConfig(html: string): string {
  const config = { APP_ID: env.APP_ID || '', APP_SECRET: env.APP_SECRET || '' }
  const script = `<script>window.__APP_CONFIG__ = ${JSON.stringify(config)}</script>`
  return html.replace('</head>', `${script}</head>`)
}

export function createApp() {
  const app = express()

  app.use(express.json())

  // 设备同步 open-api router
  app.use(routes)

  // 静态资源(若访问'/',不会默认返回 index,进入下一中间件)
  app.use(express.static(distDir, { index: false }))

  // 非 API 的 GET 请求返回注入环境变量的 index
  app.use((req, res, next) => {
    if (
      req.method !== 'GET' ||
      req.path.startsWith('/open-api') ||
      req.path.startsWith('/api') ||
      !indexHtml
    ) {
      return next()
    }
    res.type('html').send(injectRuntimeConfig(indexHtml))
  })

  // 错误处理
  app.use(notFound)
  app.use(errorHandler)

  return app
}
