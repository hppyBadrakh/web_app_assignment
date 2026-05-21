import { Store } from 'express-session'

export class SqliteSessionStore extends Store {
  constructor(db, options = {}) {
    super()
    this.db    = db
    this.table = options.tableName || 'express_sessions'
    if (!/^\w+$/.test(this.table)) throw new Error(`Invalid session store table name: ${this.table}`)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS ${this.table} (
        sid     TEXT    PRIMARY KEY,
        sess    TEXT    NOT NULL,
        expired INTEGER NOT NULL
      )
    `)
    setInterval(
      () => this.db.prepare(`DELETE FROM ${this.table} WHERE expired < ?`).run(Date.now()),
      15 * 60 * 1000
    ).unref()
  }

  get(sid, callback) {
    try {
      const row = this.db.prepare(`SELECT sess, expired FROM ${this.table} WHERE sid = ?`).get(sid)
      if (!row || row.expired < Date.now()) return callback(null, null)
      callback(null, JSON.parse(row.sess))
    } catch (e) { callback(e) }
  }

  set(sid, session, callback) {
    try {
      const expired = session.cookie?.expires
        ? new Date(session.cookie.expires).getTime()
        : Date.now() + 24 * 60 * 60 * 1000
      this.db.prepare(
        `INSERT OR REPLACE INTO ${this.table} (sid, sess, expired) VALUES (?, ?, ?)`
      ).run(sid, JSON.stringify(session), expired)
      callback(null)
    } catch (e) { callback(e) }
  }

  destroy(sid, callback) {
    try {
      this.db.prepare(`DELETE FROM ${this.table} WHERE sid = ?`).run(sid)
      callback(null)
    } catch (e) { callback(e) }
  }

  touch(sid, session, callback) {
    try {
      const expired = session.cookie?.expires
        ? new Date(session.cookie.expires).getTime()
        : Date.now() + 24 * 60 * 60 * 1000
      this.db.prepare(
        `UPDATE ${this.table} SET expired = ? WHERE sid = ?`
      ).run(expired, sid)
      callback(null)
    } catch (e) { callback(e) }
  }
}
