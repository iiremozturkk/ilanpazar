import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { getConnection, isConfigured, query } from '@/lib/db'

async function requireAdmin() {
  const session = await getSession()
  if (!session.admin) return false
  return true
}

async function ensureTable() {
  // Create once if missing (safe in demo)
  await query(
    `CREATE TABLE IF NOT EXISTS site_broadcasts (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      title VARCHAR(140) NOT NULL,
      message TEXT NOT NULL,
      link VARCHAR(255) NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_site_broadcasts_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`
  )
}

// GET /api/admin/broadcasts — list recent broadcasts
export async function GET() {
  if (!isConfigured()) {
    return NextResponse.json({ broadcasts: [], _unconfigured: true })
  }
  try {
    if (!await requireAdmin()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    await ensureTable()
    const rows = await query(
      `SELECT id, title, message, link, created_at
       FROM site_broadcasts
       ORDER BY created_at DESC
       LIMIT 50`
    )
    return NextResponse.json({ broadcasts: Array.isArray(rows) ? rows : [] })
  } catch (err) {
    console.error('[admin/broadcasts GET]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST /api/admin/broadcasts — send campaign notification to all users
// { title, message, link? }
export async function POST(req) {
  if (!isConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }
  try {
    if (!await requireAdmin()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    await ensureTable()
    const body = await req.json().catch(() => ({}))
    const title = String(body?.title || '').trim()
    const message = String(body?.message || '').trim()
    const link = body?.link ? String(body.link).trim() : null
    if (!title || !message) {
      return NextResponse.json({ error: 'BAD_REQUEST' }, { status: 400 })
    }

    const conn = await getConnection()
    try {
      await conn.beginTransaction()

      const [ins] = await conn.execute(
        `INSERT INTO site_broadcasts (title, message, link) VALUES (?, ?, ?)`,
        [title.slice(0, 140), message, link]
      )
      const broadcastId = ins.insertId

      // Create notification for all users
      await conn.execute(
        `INSERT INTO user_notifications (user_id, type, title, message, link)
         SELECT u.id, 'campaign', ?, ?, ? FROM users u`,
        [title.slice(0, 140), message, link]
      )

      await conn.commit()

      const [rows] = await conn.execute(
        `SELECT id, title, message, link, created_at FROM site_broadcasts WHERE id = ? LIMIT 1`,
        [broadcastId]
      )
      const broadcast = Array.isArray(rows) ? rows[0] : null
      return NextResponse.json({ ok: true, broadcast }, { status: 201 })
    } catch (err) {
      try { await conn.rollback() } catch {}
      throw err
    } finally {
      conn.release()
    }
  } catch (err) {
    console.error('[admin/broadcasts POST]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
