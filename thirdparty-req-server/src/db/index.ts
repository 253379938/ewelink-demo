import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'

const dbDir = join(import.meta.dirname, '../../data')
mkdirSync(dbDir, { recursive: true })
const db = new DatabaseSync(join(dbDir, 'mapping.db'))

// 映射表：eWeLink deviceid -- iHost serial_number
db.exec(`
  CREATE TABLE IF NOT EXISTS device_mapping (
    device_id    TEXT PRIMARY KEY,
    ihost_serial TEXT NOT NULL,
    uiid         TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`)

export interface DeviceMapping {
  device_id: string
  ihost_serial: string
  uiid: string
  created_at: string
}

// 保存/更新 eWeLink -- iHost
export function saveMapping(deviceId: string, ihostSerial: string, uiid: string) {
  db.prepare(
    `INSERT INTO device_mapping (device_id, ihost_serial, uiid)
     VALUES (?, ?, ?)
     ON CONFLICT(device_id) DO UPDATE SET ihost_serial = excluded.ihost_serial, uiid = excluded.uiid`,
  ).run(deviceId, ihostSerial, uiid)
}

// eWeLink deviceid 查询完整映射记录
export function getMapping(deviceId: string): DeviceMapping | undefined {
  const row = db.prepare('SELECT * FROM device_mapping WHERE device_id = ?').get(deviceId) as DeviceMapping | undefined
  return row
}

// 获取全部映射
export function getAllMapping(): DeviceMapping[] {
  return db.prepare('SELECT * FROM device_mapping').all() as unknown as DeviceMapping[]
}

// 删除一条映射（iHost 上设备已被移除时移除数据）
export function deleteMapping(deviceId: string) {
  db.prepare('DELETE FROM device_mapping WHERE device_id = ?').run(deviceId)
}
