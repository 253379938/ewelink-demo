import { createServer } from 'node:http'
import { createApp } from './app.ts'
import { config } from './config.ts'
import { setupWsServer } from './services/controlWs.ts'
import { getEWeLinkCred } from './db/index.ts'
import * as ewelinkWs from './services/ewelinkWs.ts'

const app = createApp()
const server = createServer(app)
setupWsServer(server)

server.listen(config.port, '0.0.0.0', () => {
  console.log(`thirdparty-req-server listening on http://0.0.0.0:${config.port}`)
  // 启动时连接 eWelink 云端
  const cred = getEWeLinkCred()
  if (cred) {
    ewelinkWs.connect(cred).catch((err) => console.error('ewelink ws startup err', err))
  }
})
