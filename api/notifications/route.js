import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/session'
import { isConfigured, query } from '@/lib/db'

// GET /api/notifications
export async function GET() {
  try {
    const user = await getCurrentUser().catch(() => null)
    if (!user) return NextResponse.json({ notifications: [] })
    if (!isConfigured()) return NextResponse.json({ notifications: [], _unconfigured: true })

    const rows = await query(
      `SELECT id, type, title, message, link, is_read, created_at
       FROM user_notifications
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 30`,
      [user.id]
    )

    return NextResponse.json({ notifications: Array.isArray(rows) ? rows : [] })
  } catch (e) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}

// POST /api/notifications
// { action: 'mark_all_read' }
export async function POST(req) {
  try {
    const user = await getCurrentUser().catch(() => null)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!isConfigured()) return NextResponse.json({ error: 'DB not configured', _unconfigured: true }, { status: 503 })

    const body = await req.json().catch(() => ({}))
    if (body?.action === 'mark_all_read') {
      await query('UPDATE user_notifications SET is_read = 1 WHERE user_id = ?', [user.id])
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'BAD_REQUEST' }, { status: 400 })
  } catch (e) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}

// DELETE /api/notifications
// Body: { ids: number[] }
export async function DELETE(req) {
  try {
    const user = await getCurrentUser().catch(() => null)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!isConfigured()) return NextResponse.json({ error: 'DB not configured', _unconfigured: true }, { status: 503 })

    const body = await req.json().catch(() => ({}))
    const ids = Array.isArray(body?.ids) ? body.ids.map(Number).filter(n => Number.isFinite(n)) : []
    if (!ids.length) return NextResponse.json({ error: 'BAD_REQUEST' }, { status: 400 })

    const placeholders = ids.map(() => '?').join(',')
    await query(
      `DELETE FROM user_notifications WHERE user_id = ? AND id IN (${placeholders})`,
      [user.id, ...ids]
    )

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}
