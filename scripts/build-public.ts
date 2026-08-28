// 将 web dist 复制到 server 的 public
import { cpSync, rmSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const frontendDist = join(root, 'dist')
const publicDir = join(root, 'thirdparty-req-server', 'public')

// 清掉上次的构建 assets 目录
rmSync(join(publicDir, 'assets'), { recursive: true, force: true })
// 将 web dist 复制到 server public
cpSync(frontendDist, publicDir, { recursive: true, force: true })

