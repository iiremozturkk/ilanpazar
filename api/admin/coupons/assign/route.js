import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { getConnection, isConfigured } from '@/lib/db'

async function requireAdmin() {
  const session = await getSession()
  if (!session.admin) return false
  return true
}

// POST /api/admin/coupons/assign
// { couponId, mode: 'email'|'userId'|'all', email?, userId? }
export async function POST(req) {
  if (!isConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }
  try {
    if (!await requireAdmin()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const body = await req.json().catch(() => ({}))
    const couponId = Number(body?.couponId)
    const mode = body?.mode
    if (!Number.isFinite(couponId) || couponId <= 0) {
      return NextResponse.json({ error: 'COUPON_REQUIRED' }, { status: 400 })
    }

    const conn = await getConnection()
    try {
      await conn.beginTransaction()

      // ensure coupon exists
      const [cRows] = await conn.execute(`SELECT id, code, is_public FROM coupons WHERE id = ? FOR UPDATE`, [couponId])
      const coupon = Array.isArray(cRows) ? cRows[0] : null
      if (!coupon) {
        await conn.rollback()
        return NextResponse.json({ error: 'COUPON_NOT_FOUND' }, { status: 404 })
      }
      if (coupon.is_public) {
        // Public coupons don't need assignment, but allow for convenience.
      }

      let inserted = 0

      if (mode === 'all') {
        const [res] = await conn.execute(
          `INSERT IGNORE INTO user_coupons (user_id, coupon_id, status)
           SELECT u.id, ?, 'available' FROM users u`,
          [couponId]
        )
        inserted = res?.affectedRows || 0
      } else if (mode === 'userId') {
        const userId = Number(body?.userId)
        if (!Number.isFinite(userId) || userId <= 0) {
          await conn.rollback()
          return NextResponse.json({ error: 'USER_REQUIRED' }, { status: 400 })
        }
        const [res] = await conn.execute(
          `INSERT IGNORE INTO user_coupons (user_id, coupon_id, status)
           VALUES (?, ?, 'available')`,
          [userId, couponId]
        )
        inserted = res?.affectedRows || 0
      } else {
        const email = String(body?.email || '').trim().toLowerCase()
        if (!email) {
          await conn.rollback()
          return NextResponse.json({ error: 'EMAIL_REQUIRED' }, { status: 400 })
        }
        const [uRows] = await conn.execute(`SELECT id FROM users WHERE LOWER(email) = ? LIMIT 1`, [email])
        const user = Array.isArray(uRows) ? uRows[0] : null
        if (!user) {
          await conn.rollback()
          return NextResponse.json({ error: 'USER_NOT_FOUND' }, { status: 404 })
        }
        const [res] = await conn.execute(
          `INSERT IGNORE INTO user_coupons (user_id, coupon_id, status)
           VALUES (?, ?, 'available')`,
          [user.id, couponId]
        )
        inserted = res?.affectedRows || 0
      }

      // Notify users (coupon)
      if (inserted > 0) {
        if (mode === 'all') {
          await conn.execute(
            `INSERT INTO user_notifications (user_id, type, title, message, link)
             SELECT u.id, 'coupon', 'Yeni kupon tanımlandı', CONCAT('Kupon kodu: ', ?), '/checkout'
             FROM users u`,
            [coupon.code]
          )
        } else {
          // Notify the one user (email or userId)
          let uid = null
          if (mode === 'userId') uid = Number(body?.userId)
          if (mode === 'email') {
            const email = String(body?.email || '').trim().toLowerCase()
            const [uRows] = await conn.execute(`SELECT id FROM users WHERE LOWER(email) = ? LIMIT 1`, [email])
            uid = Array.isArray(uRows) ? uRows[0]?.id : null
          }
          if (uid) {
            await conn.execute(
              `INSERT INTO user_notifications (user_id, type, title, message, link)
               VALUES (?, 'coupon', 'Yeni kupon tanımlandı', ?, '/checkout')`,
              [uid, `Kupon kodu: ${coupon.code}`]
            )
          }
        }
      }

      await conn.commit()
      return NextResponse.json({ ok: true, inserted })
    } catch (err) {
      try { await conn.rollback() } catch {}
      throw err
    } finally {
      conn.release()
    }
  } catch (err) {
    console.error('[admin/coupons assign]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
