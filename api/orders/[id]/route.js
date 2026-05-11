import { NextResponse } from 'next/server'
import { queryOne, isConfigured } from '@/lib/db'

export async function GET(request, { params }) {
  if (!isConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  try {
    const { id } = await params

    const order = await queryOne(
      `SELECT o.*, l.title as listing_title, l.cover_image as cover_image
       FROM orders o
       LEFT JOIN listings l ON l.id = o.listing_id
       WHERE o.id = ?`,
      [id]
    )

    if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Parse JSON
    if (typeof order.shipping === 'string') {
      try { order.shipping = JSON.parse(order.shipping) } catch { order.shipping = null }
    }
    if (typeof order.payment === 'string') {
      try { order.payment = JSON.parse(order.payment) } catch { order.payment = null }
    }

    return NextResponse.json({ order })
  } catch (err) {
    console.error('[GET /api/orders/:id]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
