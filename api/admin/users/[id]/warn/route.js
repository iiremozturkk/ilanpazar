import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { query, isConfigured } from '@/lib/db'

async function requireAdmin() {
  const session = await getSession()
  return session.admin ? true : null
}

// POST /api/admin/users/[id]/warn
// Sends an in-app warning notification to the user.
export async function POST(request, { params }) {
  if (!isConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  try {
    if (!await requireAdmin()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const message = typeof body?.message === 'string' ? body.message.trim() : ''

    if (!message) {
      return NextResponse.json({ error: 'MESSAGE_REQUIRED' }, { status: 400 })
    }

    const title = typeof body?.title === 'string' && body.title.trim()
      ? body.title.trim().slice(0, 140)
      : 'Uyarı'

    const link = typeof body?.link === 'string' ? body.link.trim().slice(0, 255) : null

    await query(
      `INSERT INTO user_notifications (user_id, type, title, message, link)
       VALUES (?, 'warning', ?, ?, ?)`,
      [Number(id), title, message, link]
    )

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[admin/users warn POST]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
