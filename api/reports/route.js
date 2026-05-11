import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/session'
import db from '@/lib/db'

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}))
    const listingId = Number(body?.listingId ?? body?.listing_id)
    const reason = String(body?.reason || '').trim()

    if (!listingId || Number.isNaN(listingId)) {
      return NextResponse.json({ error: 'LISTING_ID_REQUIRED' }, { status: 400 })
    }
    if (!reason || reason.length < 3) {
      return NextResponse.json({ error: 'REASON_REQUIRED' }, { status: 400 })
    }

    const listing = await db.queryOne('SELECT id FROM listings WHERE id = ? LIMIT 1', [listingId])
    if (!listing) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    }

    const user = await getCurrentUser()
    const reporterId = user?.id ? Number(user.id) : null

    // Prevent duplicate reports from the same logged-in user for the same listing.
    if (reporterId) {
      const existing = await db.queryOne(
        'SELECT id FROM listing_reports WHERE listing_id = ? AND reporter_user_id = ? LIMIT 1',
        [listingId, reporterId]
      )
      if (existing) {
        return NextResponse.json({ error: 'ALREADY_REPORTED' }, { status: 409 })
      }
    }

    await db.query(
      'INSERT INTO listing_reports (listing_id, reporter_user_id, reason, status) VALUES (?, ?, ?, "open")',
      [listingId, reporterId, reason]
    )

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[reports]', err)
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
  }
}
