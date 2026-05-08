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

// ── USERS хүснэгт ────────────────────────────────────────────────────────────
// Хэрэглэгч бүр өвөрмөц хэрэглэгчийн нэр, и-мэйл, нууцлагдсан нууц үг болон дүртэй байна.
// Дүр (role) нь хэрэглэгч юу хийж болохыг тодорхойлдог (жишээ нь "user" vs "admin").
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT    NOT NULL UNIQUE,
    email         TEXT    NOT NULL UNIQUE,
    password_hash TEXT    NOT NULL,
    role          TEXT    NOT NULL DEFAULT 'user',
    created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
  )
`)

// ── SESSIONS хүснэгт ─────────────────────────────────────────────────────────
// Хэрэглэгч нэвтрэх үед санамсаргүй токентой мөр үүсгэнэ.
// Frontend нь хүсэлт бүрт тэр токеныг илгээдэг тул хэн холбогдож байгааг мэдэж авна.
// Хэрэглэгч гарах үед тэр мөрийг устгана.
db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token      TEXT    NOT NULL UNIQUE,
    expires_at TEXT    NOT NULL,
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  )
`)

// ── LOGIN ATTEMPTS хүснэгт ───────────────────────────────────────────────────
// Нэвтрэх оролдлого бүрийг (амжилттай эсвэл амжилтгүй) энд хадгална.
// Богино хугацаанд хэт олон амжилтгүй оролдлого гарвал цаашид нэвтрэхийг хаана
// нууц үгийг таах (brute-force) халдлагаас хамгаалахын тулд.
db.exec(`
  CREATE TABLE IF NOT EXISTS login_attempts (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    username     TEXT    NOT NULL,
    ip_address   TEXT,
    success      INTEGER NOT NULL DEFAULT 0,
    attempted_at TEXT    NOT NULL DEFAULT (datetime('now'))
  )
`)

// ── БАЙГАА ХҮСНЭГТҮҮДЭД created_by НЭМНЭ ───────────────────────────────────
// Шалгалт / тэмцээн бүрийг хэн үүсгэсэнийг хадгалдаг тул
// "зөвхөн эзэмшигч нь өөрийн өгөгдлийг засаж устгаж болно" гэсэн дүрмийг хэрэгжүүлнэ.
// Багана аль хэдийн байгаа бол ALTER TABLE чимээгүй алдаатай дуусна — энэ нь зориудаар хийсэн.
try { db.exec('ALTER TABLE exams        ADD COLUMN created_by INTEGER REFERENCES users(id)') } catch (_) {}
try { db.exec('ALTER TABLE competitions ADD COLUMN created_by INTEGER REFERENCES users(id)') } catch (_) {}

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
