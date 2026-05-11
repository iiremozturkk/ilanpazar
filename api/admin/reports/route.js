import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { query, isConfigured } from '@/lib/db'

async function requireAdmin() {
  const session = await getSession()
  if (!session.admin) return null
  return true
}

// GET /api/admin/reports — list reported listings
export async function GET() {
  if (!isConfigured()) {
    return NextResponse.json({ reports: [], _unconfigured: true })
  }
  try {
    if (!await requireAdmin()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const reports = await query(
      `SELECT r.id, r.listing_id, r.reporter_user_id, r.reason, r.status, r.created_at,
              l.title as listing_title, l.status as listing_status, l.is_approved as listing_is_approved,
              u.name as reporter_name, u.email as reporter_email
       FROM listing_reports r
       JOIN listings l ON r.listing_id = l.id
       LEFT JOIN users u ON r.reporter_user_id = u.id
       ORDER BY r.created_at DESC`
    )

    return NextResponse.json({ reports })
  } catch (err) {
    console.error('[admin/reports GET]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
