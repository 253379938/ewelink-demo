import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'

const dbDir = join(import.meta.dirname, '../../data')
mkdirSync(dbDir, { recursive: true })
const db = new DatabaseSync(join(dbDir, 'mapping.db'))

// eWeLink 凭证，server 启动时读取连接 eWeLink WS
db.exec(`
  CREATE TABLE IF NOT EXISTS ewelink_cred (
    id         INTEGER PRIMARY KEY CHECK (id = 1),
    at         TEXT NOT NULL,
    apikey     TEXT NOT NULL,
    appid      TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  )
`)

export interface EWeLinkCred {
  at: string
  apikey: string
  appid: string
}

// 保存/更新 eWeLink 连接凭据
export function saveEWeLinkCred(at: string, apikey: string, appid: string) {
  db.prepare(
    `INSERT INTO ewelink_cred (id, at, apikey, appid)
     VALUES (1, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET at = excluded.at, apikey = excluded.apikey, appid = excluded.appid`,
  ).run(at, apikey, appid)
}

// 读取 eWeLink 连接凭证
export function getEWeLinkCred(): EWeLinkCred | undefined {
  const row = db.prepare('SELECT at, apikey, appid FROM ewelink_cred WHERE id = 1').get() as EWeLinkCred | undefined
  return row
}

// iHost 访问凭据表
db.exec(`
  CREATE TABLE IF NOT EXISTS ihost_cred (
    id         INTEGER PRIMARY KEY CHECK (id = 1),
    at         TEXT NOT NULL,
    url        TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  )
`)

export interface IHostCred {
  at: string
  url: string
}

// 保存/更新 iHost 访问凭据
export function saveIHostCred(at: string, url: string) {
  db.prepare(
    `INSERT INTO ihost_cred (id, at, url)
     VALUES (1, ?, ?)
     ON CONFLICT(id) DO UPDATE SET at = excluded.at, url = excluded.url`,
  ).run(at, url)
}

// 读取 iHost 访问凭据
export function getIHostCred(): IHostCred | undefined {
  const row = db.prepare('SELECT at, url FROM ihost_cred WHERE id = 1').get() as IHostCred | undefined
  return row
}
