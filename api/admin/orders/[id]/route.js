import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { getConnection, isConfigured } from '@/lib/db'

async function requireAdmin() {
  const session = await getSession()
  if (!session.admin) return false
  return true
}

function statusToNotification(status) {
  if (status === 'paid') {
    return {
      type: 'order',
      title: 'Ödeme alındı',
      message: 'Ödemeniz başarıyla alındı. Siparişiniz hazırlanıyor.',
    }
  }
  if (status === 'shipped') {
    return {
      type: 'shipping',
      title: 'Kargonuz yola çıktı',
      message: 'Siparişiniz kargoya verildi. Takip için sipariş detayına gidebilirsiniz.',
    }
  }
  if (status === 'cancelled') {
    return {
      type: 'order',
      title: 'Sipariş iptal edildi',
      message: 'Siparişiniz iptal edildi. Detaylar için sipariş sayfasına bakabilirsiniz.',
    }
  }
  return null
}

// PATCH /api/admin/orders/:id — update status and notify buyer
export async function PATCH(req, { params }) {
  if (!isConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }
  try {
    if (!await requireAdmin()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const id = Number(params?.id)
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: 'BAD_REQUEST' }, { status: 400 })
    }

    const body = await req.json().catch(() => ({}))
    const status = body?.status
    const allowed = new Set(['created', 'paid', 'shipped', 'cancelled'])
    if (!allowed.has(status)) {
      return NextResponse.json({ error: 'BAD_STATUS' }, { status: 400 })
    }

    const conn = await getConnection()
    try {
      await conn.beginTransaction()

      const [rows] = await conn.execute(
        `SELECT id, buyer_user_id, status FROM orders WHERE id = ? FOR UPDATE`,
        [id]
      )
      const order = Array.isArray(rows) ? rows[0] : null
      if (!order) {
        await conn.rollback()
        return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
      }

      if (order.status !== status) {
        await conn.execute(`UPDATE orders SET status = ? WHERE id = ?`, [status, id])

        // Notify buyer
        if (order.buyer_user_id) {
          const notif = statusToNotification(status)
          if (notif) {
            await conn.execute(
              `INSERT INTO user_notifications (user_id, type, title, message, link)
               VALUES (?, ?, ?, ?, ?)`,
              [
                order.buyer_user_id,
                notif.type,
                notif.title,
                notif.message,
                `/order-success/${id}`,
              ]
            )
          }
        }
      }

      await conn.commit()
      return NextResponse.json({ ok: true })
    } catch (err) {
      try { await conn.rollback() } catch {}
      throw err
    } finally {
      conn.release()
    }
  } catch (err) {
    console.error('[admin/orders PATCH]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
