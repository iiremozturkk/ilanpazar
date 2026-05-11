import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/session'
import { getConnection, isConfigured } from '@/lib/db'

export async function PATCH(request, { params }) {
  if (!isConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  const conn = await getConnection()
  try {
    const user = await getCurrentUser().catch(() => null)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const action = String(body?.action || 'ship')

    const carrier = String(body?.carrier || '').trim().slice(0, 80)
    const trackingNumber = String(body?.trackingNumber || '').trim().slice(0, 80)

    await conn.beginTransaction()

    const [rows] = await conn.execute('SELECT * FROM orders WHERE id = ? FOR UPDATE', [id])
    const order = Array.isArray(rows) ? rows[0] : null
    if (!order) {
      await conn.rollback()
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    if (Number(order.seller_user_id) !== Number(user.id)) {
      await conn.rollback()
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (action === 'approve_cancel') {
      if (order.status !== 'cancel_requested') {
        await conn.rollback()
        return NextResponse.json({ error: 'NOT_CANCELLATION_REQUEST' }, { status: 409 })
      }

      await conn.execute(`UPDATE orders SET status = 'cancelled' WHERE id = ?`, [id])

      if (order.buyer_user_id) {
        await conn.execute(
          `INSERT INTO user_notifications (user_id, type, title, message, link)
           VALUES (?, 'order', 'İptal/iade işlemi gerçekleştirildi', ?, ?)`,
          [order.buyer_user_id, `Sipariş #${id} iptal edildi. İptal/iade işlemi gerçekleştirildi.`, `/my-orders`]
        )
      }
    } else if (action === 'approve_return') {
      if (order.status !== 'return_requested') {
        await conn.rollback()
        return NextResponse.json({ error: 'NOT_RETURN_REQUEST' }, { status: 409 })
      }

      let shipping = null
      if (typeof order.shipping === 'string') {
        try { shipping = JSON.parse(order.shipping) } catch { shipping = null }
      } else {
        shipping = order.shipping
      }
      shipping = shipping && typeof shipping === 'object' ? shipping : {}
      shipping.returnApproved = true
      shipping.returnApprovedAt = new Date().toISOString()

      await conn.execute(`UPDATE orders SET status = 'returned', shipping = ? WHERE id = ?`, [JSON.stringify(shipping), id])

      if (order.buyer_user_id) {
        await conn.execute(
          `INSERT INTO user_notifications (user_id, type, title, message, link)
           VALUES (?, 'order', 'İptal/iade işlemi gerçekleştirildi', ?, ?)`,
          [order.buyer_user_id, `Sipariş #${id} için iade işlemi gerçekleştirildi.`, `/my-orders`]
        )
      }
    } else {
      // ship (default)
      if (!carrier || !trackingNumber) {
        await conn.rollback()
        return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
      }

      if (['cancelled', 'cancel_requested', 'return_requested', 'returned'].includes(order.status)) {
        await conn.rollback()
        return NextResponse.json({ error: 'NOT_SHIPPABLE' }, { status: 409 })
      }

      let shipping = null
      if (typeof order.shipping === 'string') {
        try { shipping = JSON.parse(order.shipping) } catch { shipping = null }
      } else {
        shipping = order.shipping
      }
      shipping = shipping && typeof shipping === 'object' ? shipping : {}
      shipping.carrier = carrier
      shipping.trackingNumber = trackingNumber
      shipping.shippedAt = new Date().toISOString()

      await conn.execute(
        `UPDATE orders SET status = 'shipped', shipping = ? WHERE id = ?`,
        [JSON.stringify(shipping), id]
      )

      // Notify buyer
      if (order.buyer_user_id) {
        await conn.execute(
          `INSERT INTO user_notifications (user_id, type, title, message, link)
           VALUES (?, 'shipping', 'Kargonuz yola çıktı', ?, ?)`,
          [order.buyer_user_id, `Sipariş #${id} kargoya verildi. Takip: ${carrier} / ${trackingNumber}`, `/my-orders`]
        )
      }
    }

    await conn.commit()
    return NextResponse.json({ ok: true })
  } catch (err) {
    try { await conn.rollback() } catch {}
    console.error('[PATCH /api/sales/:id]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  } finally {
    conn.release()
  }
}
