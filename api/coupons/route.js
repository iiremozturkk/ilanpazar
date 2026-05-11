import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/session'
import { isConfigured, query, queryOne } from '@/lib/db'

function nowSql() {
  // MySQL uses server time; keep comparisons on DB side.
  return 'NOW()'
}

async function fetchCouponForUser({ userId, code }) {
  // Coupon must be active and within validity window.
  // For now we require the coupon to be assigned to the user OR public.
  return await queryOne(
    `SELECT c.id, c.code, c.type, c.value, c.min_subtotal, c.is_public, c.max_uses, c.used_count, c.expires_at
     FROM coupons c
     LEFT JOIN user_coupons uc
       ON uc.coupon_id = c.id AND uc.user_id = ?
     WHERE c.code = ?
       AND c.active = 1
       AND (c.starts_at IS NULL OR c.starts_at <= ${nowSql()})
       AND (c.expires_at IS NULL OR c.expires_at >= ${nowSql()})
       AND (c.max_uses IS NULL OR c.used_count < c.max_uses)
       AND (c.is_public = 1 OR uc.id IS NOT NULL)
       AND (uc.status IS NULL OR uc.status = 'available')
     LIMIT 1`,
    [userId, code]
  )
}

// GET /api/coupons
// - /api/coupons?code=ABC -> validate coupon code for current user
// - /api/coupons -> list user's available coupons
export async function GET(request) {
  try {
    if (!isConfigured()) return NextResponse.json({ coupons: [], _unconfigured: true })

    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const code = url.searchParams.get('code')

    if (code) {
      const coupon = await fetchCouponForUser({ userId: user.id, code: String(code).trim() })
      if (!coupon) return NextResponse.json({ error: 'COUPON_INVALID' }, { status: 404 })
      return NextResponse.json({ coupon })
    }

    const coupons = await query(
      `SELECT c.id, c.code, c.type, c.value, c.min_subtotal, c.expires_at
       FROM user_coupons uc
       JOIN coupons c ON c.id = uc.coupon_id
       WHERE uc.user_id = ? AND uc.status = 'available' AND c.active = 1
         AND (c.starts_at IS NULL OR c.starts_at <= ${nowSql()})
         AND (c.expires_at IS NULL OR c.expires_at >= ${nowSql()})
         AND (c.max_uses IS NULL OR c.used_count < c.max_uses)
       ORDER BY uc.created_at DESC`,
      [user.id]
    )

    return NextResponse.json({ coupons: Array.isArray(coupons) ? coupons : [] })
  } catch (e) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}
