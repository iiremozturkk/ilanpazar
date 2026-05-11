import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { query, isConfigured } from '@/lib/db'

async function requireAdmin() {
  const session = await getSession()
  return session.admin ? true : null
}

// GET /api/admin/users — all users
export async function GET() {
  if (!isConfigured()) {
    return NextResponse.json({ users: [], _unconfigured: true })
  }
  try {
    if (!await requireAdmin()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Be tolerant to older schemas without is_blocked.
    let users
    try {
      users = await query(
        `SELECT id, name, email, phone, created_at, is_blocked,
                (SELECT COUNT(*) FROM listings WHERE user_id = users.id) as listing_count
         FROM users
         ORDER BY created_at DESC`
      )
    } catch (e) {
      users = await query(
        `SELECT id, name, email, phone, created_at,
                0 as is_blocked,
                (SELECT COUNT(*) FROM listings WHERE user_id = users.id) as listing_count
         FROM users
         ORDER BY created_at DESC`
      )
    }

    return NextResponse.json({ users })
  } catch (err) {
    console.error('[admin/users GET]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
