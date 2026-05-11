import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/session'
import { query, isConfigured } from '@/lib/db'

export async function GET() {
  if (!isConfigured()) {
    return NextResponse.json({ orders: [], _unconfigured: true })
  }
  try {
    const user = await getCurrentUser().catch(() => null)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const rows = await query(
      `SELECT o.*, l.title as listing_title, l.cover_image,
              COALESCE(b.name, '') as buyer_name, COALESCE(b.email,'') as buyer_email
       FROM orders o
       LEFT JOIN listings l ON l.id = o.listing_id
       LEFT JOIN users b ON b.id = o.buyer_user_id
       WHERE o.seller_user_id = ?
       ORDER BY o.created_at DESC`,
      [user.id]
    )

    for (const o of rows) {
      if (typeof o.shipping === 'string') {
        try { o.shipping = JSON.parse(o.shipping) } catch { o.shipping = null }
      }
      if (typeof o.payment === 'string') {
        try { o.payment = JSON.parse(o.payment) } catch { o.payment = null }
      }
    }

    return NextResponse.json({ orders: rows })
  } catch (err) {
    console.error('[GET /api/sales]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
