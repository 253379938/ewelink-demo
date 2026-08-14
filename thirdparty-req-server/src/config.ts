import { env } from 'node:process'

export const config = {
  // 服务端口，默认 3001
  port: Number(env.PORT ?? 3001),
} as const
