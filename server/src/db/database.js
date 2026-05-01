import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DB_PATH = join(__dirname, '../../testhub.db')

const db = new Database(DB_PATH)

db.exec(`
  CREATE TABLE IF NOT EXISTS exams (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    icon        TEXT    NOT NULL DEFAULT '📝',
    icon_color  TEXT    NOT NULL DEFAULT 'icon-blue',
    name        TEXT    NOT NULL,
    price       TEXT    NOT NULL DEFAULT 'Үнэгүй',
    subject     TEXT    NOT NULL,
    year        TEXT    NOT NULL,
    questions   INTEGER NOT NULL DEFAULT 0,
    duration    TEXT    NOT NULL DEFAULT '60 мин',
    difficulty  TEXT    NOT NULL DEFAULT 'Дунд'
  )
`)

db.exec(`
  CREATE TABLE IF NOT EXISTS competitions (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    icon         TEXT    NOT NULL DEFAULT '🏆',
    icon_class   TEXT    NOT NULL DEFAULT 'icon-gold',
    title        TEXT    NOT NULL,
    date         TEXT    NOT NULL,
    status       TEXT    NOT NULL DEFAULT 'upcoming',
    participants INTEGER NOT NULL DEFAULT 0,
    prize        TEXT    NOT NULL DEFAULT '₮0',
    subject      TEXT    NOT NULL,
    price        INTEGER NOT NULL DEFAULT 0,
    likes        INTEGER NOT NULL DEFAULT 0
  )
`)

export function save() {}

export function queryOne(sql, params = []) {
  return db.prepare(sql).get(params)
}

export function queryAll(sql, params = []) {
  return db.prepare(sql).all(params)
}

export function runSql(sql, params = []) {
  const result = db.prepare(sql).run(params)
  return result.lastInsertRowid ?? null
}

export default db
