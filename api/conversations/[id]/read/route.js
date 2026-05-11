import { NextResponse } from 'next/server'
import db from '@/lib/db'
import { getCurrentUser } from '@/lib/session'

export async function POST(_req, { params }) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Keep ids as strings to avoid JS number precision issues.
    const { id } = await params
    const convId = String(id || '')
    if (!/^\d+$/.test(convId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

    // Mark all messages where current user is receiver as read
    await db.query(
      `UPDATE conversation_messages SET read_at = NOW()
       WHERE conversation_id = ? AND receiver_user_id = ? AND read_at IS NULL`,
      [convId, user.id]
    )

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}
