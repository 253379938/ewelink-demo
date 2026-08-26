import { env } from 'node:process'
import os from 'os';

const computerName = os.hostname();
export const config = {
  // 服务端口，默认 3001
  port: Number(env.PORT ?? 3001),
  ServerAddress: env.SERVER_ADDRESS ?? `http://${computerName}.local:${env.PORT ?? 3001}`
} as const
