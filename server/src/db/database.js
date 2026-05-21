import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DB_PATH = process.env.TEST_DB
  ? process.env.TEST_DB
  : join(__dirname, '../../testhub.db')

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

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT    NOT NULL UNIQUE,
    email         TEXT    NOT NULL UNIQUE,
    password_hash TEXT    NOT NULL,
    role          TEXT    NOT NULL DEFAULT 'user',
    avatar_url    TEXT,
    created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
  )
`)

// Legacy token-based sessions — kept for admin Bearer-token auth
db.exec(`
  CREATE TABLE IF NOT EXISTS token_sessions (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token      TEXT    NOT NULL UNIQUE,
    expires_at TEXT    NOT NULL,
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  )
`)

db.exec(`
  CREATE TABLE IF NOT EXISTS login_attempts (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    username     TEXT    NOT NULL,
    ip_address   TEXT,
    success      INTEGER NOT NULL DEFAULT 0,
    attempted_at TEXT    NOT NULL DEFAULT (datetime('now'))
  )
`)

// Rename legacy sessions table if it still exists under the old name
try { db.exec('ALTER TABLE sessions RENAME TO token_sessions') } catch (_) {}

// Add new columns if upgrading an existing database
try { db.exec('ALTER TABLE exams        ADD COLUMN created_by INTEGER REFERENCES users(id)') } catch (_) {}
try { db.exec('ALTER TABLE competitions ADD COLUMN created_by INTEGER REFERENCES users(id)') } catch (_) {}
try { db.exec('ALTER TABLE users        ADD COLUMN avatar_url TEXT') } catch (_) {}

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
