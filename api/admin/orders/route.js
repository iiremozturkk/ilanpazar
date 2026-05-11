import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { query, isConfigured } from '@/lib/db'

async function requireAdmin() {
  const session = await getSession()
  if (!session.admin) return false
  return true
}

// GET /api/admin/orders — list orders
export async function GET() {
  if (!isConfigured()) {
    return NextResponse.json({ orders: [], _unconfigured: true })
  }
  try {
    if (!await requireAdmin()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const orders = await query(
      `SELECT o.id, o.listing_id, o.buyer_user_id, o.quantity, o.unit_price,
              o.coupon_code, o.discount_amount, o.total_price, o.status, o.created_at,
              l.title as listing_title,
              u.name as buyer_name, u.email as buyer_email
       FROM orders o
       JOIN listings l ON o.listing_id = l.id
       LEFT JOIN users u ON o.buyer_user_id = u.id
       ORDER BY o.created_at DESC
       LIMIT 300`
    )

    return NextResponse.json({ orders: Array.isArray(orders) ? orders : [] })
  } catch (err) {
    console.error('[admin/orders GET]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
