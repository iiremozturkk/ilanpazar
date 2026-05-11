import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { query } from '@/lib/db'

async function requireAdmin() {
  const session = await getSession()
  return session.admin ? true : null
}

export async function DELETE(request, { params }) {
  try {
    if (!await requireAdmin()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    // Cascade deletes listings due to FK constraint
    await query('DELETE FROM users WHERE id = ?', [id])
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[admin/users DELETE]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// PATCH /api/admin/users/[id] — block/unblock user
export async function PATCH(request, { params }) {
  try {
    if (!await requireAdmin()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const isBlocked = body?.is_blocked
    const cascadeListings = body?.cascade_listings === true

    if (typeof isBlocked !== 'boolean') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    // Be tolerant to older schemas without is_blocked.
    try {
      await query('UPDATE users SET is_blocked = ? WHERE id = ?', [isBlocked ? 1 : 0, id])
      if (isBlocked && cascadeListings) {
        await query(`UPDATE listings SET status = 'passive', is_approved = 0 WHERE user_id = ?`, [id])
      }
    } catch (e) {
      return NextResponse.json({ error: 'SCHEMA_MISSING_IS_BLOCKED' }, { status: 409 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[admin/users PATCH]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
