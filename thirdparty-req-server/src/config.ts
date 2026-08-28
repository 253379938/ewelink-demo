import { env, loadEnvFile } from 'node:process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

// 开发时读取 .env.local
try {
  const envLocal = join(import.meta.dirname, '../../.env.local')
  if (existsSync(envLocal)) {
    loadEnvFile(envLocal)
  }
} catch {
}

export const config = {
  // 服务端口，默认 3001
  port: Number(env.PORT ?? 3001),
  hostPort: Number(env.HOST_PORT ?? 5173),
  // ServerAddress: env.SERVER_ADDRESS ?? `http://${computerName}.local:${env.PORT ?? 3001}`,
  // eWeLink 凭证
  appId: env.APP_ID ?? '',
  appSecret: env.APP_SECRET ?? '',
  server_address: env.SERVER_ADDRESS ?? `http://127.0.0.1:${env.HOST_PORT ?? 5173}`
} as const

