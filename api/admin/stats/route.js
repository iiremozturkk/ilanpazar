import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { query, isConfigured } from '@/lib/db'

async function requireAdmin() {
  const session = await getSession()
  return session.admin ? true : null
}

// GET /api/admin/stats — dashboard statistics
export async function GET() {
  if (!isConfigured()) {
    return NextResponse.json({ stats: { total_users: 0, total_listings: 0, active_listings: 0, passive_listings: 0, total_views: 0 }, _unconfigured: true })
  }
  try {
    if (!await requireAdmin()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const [totals] = await query(
      `SELECT
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM listings) as total_listings,
        (SELECT COUNT(*) FROM listings WHERE status = 'active') as active_listings,
        (SELECT COUNT(*) FROM listings WHERE status = 'passive') as passive_listings,
        (SELECT COALESCE(SUM(views),0) FROM listings) as total_views`
    )

    return NextResponse.json({ stats: totals })
  } catch (err) {
    console.error('[admin/stats GET]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
