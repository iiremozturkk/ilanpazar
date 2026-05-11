import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/session'
import { getConnection, isConfigured } from '@/lib/db'

function computeDiscount(subtotal, coupon) {
  const sub = Number(subtotal) || 0
  if (!coupon || sub <= 0) return 0
  const min = Number(coupon.min_subtotal) || 0
  if (min > 0 && sub < min) return 0
  if (coupon.type === 'percent') {
    const pct = Math.max(0, Math.min(100, Number(coupon.value) || 0))
    return Math.round(sub * (pct / 100) * 100) / 100
  }
  const fixed = Math.max(0, Number(coupon.value) || 0)
  return Math.min(fixed, sub)
}

export async function POST(request) {
  if (!isConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  const conn = await getConnection()
  try {
    const user = await getCurrentUser().catch(() => null)
    const body = await request.json()
    const items = Array.isArray(body?.items) ? body.items : []

    if (items.length === 0) {
      return NextResponse.json({ error: 'Missing items' }, { status: 400 })
    }

    // Normalize + validate quantities
    const normalized = items
      .map(it => ({
        listingId: Number(it.listingId),
        quantity: Math.max(1, Math.floor(Number(it.quantity) || 1)),
      }))
      .filter(it => Number.isFinite(it.listingId) && it.listingId > 0)

    if (normalized.length === 0) {
      return NextResponse.json({ error: 'Missing items' }, { status: 400 })
    }

    const shipping = body?.shipping ?? null
    const couponCodeInput = body?.couponCode ? String(body.couponCode).trim() : ''

    // IMPORTANT: This is a demo app.
    // Do not store full card numbers or CVV. We store only method + last4.
    const paymentInput = body?.payment ?? {}
    const cardNumber = String(paymentInput?.cardNumber || '').replace(/\s/g, '')
    const last4 = cardNumber.length >= 4 ? cardNumber.slice(-4) : ''
    const payment = {
      method: paymentInput?.method || 'card',
      cardName: paymentInput?.cardName ? String(paymentInput.cardName).slice(0, 100) : '',
      last4,
      expiry: paymentInput?.expiry ? String(paymentInput.expiry).slice(0, 10) : '',
    }

    await conn.beginTransaction()

    const orderIds = []
    const lines = []

    // 1) Lock & decrement stock, collect pricing.
    for (const it of normalized) {
      const [rows] = await conn.execute(
        `SELECT id, user_id, price, stock, title FROM listings WHERE id = ? FOR UPDATE`,
        [it.listingId]
      )
      const listing = Array.isArray(rows) ? rows[0] : null
      if (!listing) {
        await conn.rollback()
        return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
      }

      const available = Number(listing.stock) || 0
      if (available < it.quantity) {
        await conn.rollback()
        return NextResponse.json({ error: 'OUT_OF_STOCK' }, { status: 409 })
      }

      await conn.execute(`UPDATE listings SET stock = stock - ? WHERE id = ?`, [it.quantity, it.listingId])

      const unitPrice = Number(listing.price) || 0
      const lineTotal = Math.round(unitPrice * it.quantity * 100) / 100
      lines.push({
        listingId: it.listingId,
        sellerUserId: Number(listing.user_id),
        quantity: it.quantity,
        unitPrice,
        lineTotal,
      })
    }

    const subtotal = lines.reduce((acc, l) => acc + (Number(l.lineTotal) || 0), 0)

    // 2) Validate coupon (if provided and user logged in)
    let coupon = null
    let discountTotal = 0
    let userCouponId = null

    if (couponCodeInput && user?.id) {
      const [cRows] = await conn.execute(
        `SELECT c.id, c.code, c.type, c.value, c.min_subtotal, c.is_public, c.max_uses, c.used_count
         FROM coupons c
         WHERE c.code = ?
           AND c.active = 1
           AND (c.starts_at IS NULL OR c.starts_at <= NOW())
           AND (c.expires_at IS NULL OR c.expires_at >= NOW())
           AND (c.max_uses IS NULL OR c.used_count < c.max_uses)
         FOR UPDATE`,
        [couponCodeInput]
      )
      coupon = Array.isArray(cRows) ? cRows[0] : null
      if (!coupon) {
        await conn.rollback()
        return NextResponse.json({ error: 'COUPON_INVALID' }, { status: 404 })
      }

      // If not public, must be assigned to the user.
      if (!coupon.is_public) {
        const [ucRows] = await conn.execute(
          `SELECT id, status FROM user_coupons WHERE user_id = ? AND coupon_id = ? FOR UPDATE`,
          [user.id, coupon.id]
        )
        const uc = Array.isArray(ucRows) ? ucRows[0] : null
        if (!uc || uc.status !== 'available') {
          await conn.rollback()
          return NextResponse.json({ error: 'COUPON_NOT_AVAILABLE' }, { status: 409 })
        }
        userCouponId = uc.id
      }

      discountTotal = computeDiscount(subtotal, coupon)
    }

    // 3) Allocate discount across lines (pro-rata)
    let allocated = 0
    const perLineDiscounts = lines.map((l, idx) => {
      if (!discountTotal || subtotal <= 0) return 0
      if (idx === lines.length - 1) {
        // fix rounding drift on last line
        return Math.round((discountTotal - allocated) * 100) / 100
      }
      const share = (Number(l.lineTotal) || 0) / subtotal
      const d = Math.round(discountTotal * share * 100) / 100
      allocated += d
      return d
    })

    // 4) Insert orders
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i]
      const discountAmount = perLineDiscounts[i] || 0
      const totalPrice = Math.max(0, (Number(l.lineTotal) || 0) - discountAmount)

      const [ins] = await conn.execute(
        `INSERT INTO orders (buyer_user_id, listing_id, seller_user_id, quantity, unit_price, coupon_code, discount_amount, total_price, shipping, payment, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'created')`,
        [
          user?.id ?? null,
          l.listingId,
          l.sellerUserId,
          l.quantity,
          l.unitPrice,
          coupon ? coupon.code : null,
          discountAmount,
          totalPrice,
          shipping ? JSON.stringify(shipping) : null,
          JSON.stringify(payment),
        ]
      )
      orderIds.push(ins.insertId)
    }

    // 5) Mark coupon used / increment counters
    if (coupon && user?.id) {
      if (coupon.is_public) {
        await conn.execute(`UPDATE coupons SET used_count = used_count + 1 WHERE id = ?`, [coupon.id])
      } else if (userCouponId) {
        await conn.execute(
          `UPDATE user_coupons SET status = 'used', used_order_id = ?, used_at = NOW() WHERE id = ?`,
          [orderIds[0] || null, userCouponId]
        )
      }
    }

    // 6) Create notifications
    if (user?.id) {
      await conn.execute(
        `INSERT INTO user_notifications (user_id, type, title, message, link)
         VALUES (?, 'order', ?, ?, ?)`,
        [
          user.id,
          'Sipariş oluşturuldu',
          `Siparişiniz alındı. Sipariş No: #${orderIds[0]}`, 
          `/order-success/${orderIds[0]}`,
        ]
      )
    }

    await conn.commit()

    return NextResponse.json(
      { ok: true, orderId: orderIds[0], orderIds, coupon: coupon ? { code: coupon.code, discountTotal } : null },
      { status: 201 }
    )
  } catch (err) {
    try { await conn.rollback() } catch {}
    console.error('[POST /api/orders]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  } finally {
    conn.release()
  }
}
