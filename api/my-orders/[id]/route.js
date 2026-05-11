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
    const action = body?.action

    await conn.beginTransaction()

    const [rows] = await conn.execute(
      `SELECT * FROM orders WHERE id = ? FOR UPDATE`,
      [id]
    )
    const order = Array.isArray(rows) ? rows[0] : null
    if (!order) {
      await conn.rollback()
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    if (Number(order.buyer_user_id) !== Number(user.id)) {
      await conn.rollback()
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (action === 'cancel') {
      if (!['created', 'paid'].includes(order.status)) {
        await conn.rollback()
        return NextResponse.json({ error: 'NOT_CANCELLABLE' }, { status: 409 })
      }

      // Buyer requests cancellation; seller must approve.
      await conn.execute(`UPDATE orders SET status = 'cancel_requested' WHERE id = ?`, [id])

      // notify seller
      if (order.seller_user_id) {
        await conn.execute(
          `INSERT INTO user_notifications (user_id, type, title, message, link)
           VALUES (?, 'order', 'İptal talebi', ?, ?)`,
          [order.seller_user_id, `Sipariş #${id} için iptal talebi oluşturuldu.`, `/sales`]
        )
      }

      // notify buyer
      await conn.execute(
        `INSERT INTO user_notifications (user_id, type, title, message, link)
         VALUES (?, 'order', 'İptal talebi gönderildi', ?, ?)`,
        [user.id, `Sipariş #${id} için iptal talebiniz satıcı onayına gönderildi.`, `/my-orders`]
      )
    } else if (action === 'return') {
      // Buyer requests return; seller must approve.
      let shipping = null
      if (typeof order.shipping === 'string') {
        try { shipping = JSON.parse(order.shipping) } catch { shipping = null }
      } else {
        shipping = order.shipping
      }
      shipping = shipping && typeof shipping === 'object' ? shipping : {}
      shipping.returnRequested = true
      shipping.returnRequestedAt = new Date().toISOString()

      await conn.execute(`UPDATE orders SET status = 'return_requested', shipping = ? WHERE id = ?`, [JSON.stringify(shipping), id])

      // notify seller
      if (order.seller_user_id) {
        await conn.execute(
          `INSERT INTO user_notifications (user_id, type, title, message, link)
           VALUES (?, 'order', 'İade talebi', ?, ?)`,
          [order.seller_user_id, `Sipariş #${id} için iade talebi oluşturuldu.`, `/sales`]
        )
      }

      // notify buyer
      await conn.execute(
        `INSERT INTO user_notifications (user_id, type, title, message, link)
         VALUES (?, 'order', 'İade talebi gönderildi', ?, ?)`,
        [user.id, `Sipariş #${id} için iade talebiniz satıcı onayına gönderildi.`, `/my-orders`]
      )
    } else {
      await conn.rollback()
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    await conn.commit()
    return NextResponse.json({ ok: true })
  } catch (err) {
    try { await conn.rollback() } catch {}
    console.error('[PATCH /api/my-orders/:id]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  } finally {
    conn.release()
  }
}
