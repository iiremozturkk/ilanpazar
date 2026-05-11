import { NextResponse } from 'next/server'
import { query, isConfigured } from '@/lib/db'
import { getCurrentUser } from '@/lib/session'

async function ensureReviewsTable() {
  // Create on-demand so existing deployments don't require manual migration.
  await query(`
    CREATE TABLE IF NOT EXISTS listing_reviews (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      listing_id BIGINT UNSIGNED NOT NULL,
      order_id BIGINT UNSIGNED NOT NULL,
      buyer_user_id BIGINT UNSIGNED NOT NULL,
      rating TINYINT UNSIGNED NOT NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uniq_listing_reviews_order (order_id),
      KEY idx_listing_reviews_listing_id_created_at (listing_id, created_at),
      KEY idx_listing_reviews_buyer (buyer_user_id, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `)
}

function clampRating(v) {
  const n = Math.floor(Number(v))
  if (!Number.isFinite(n)) return null
  if (n < 1) return 1
  if (n > 5) return 5
  return n
}

async function getEligibleOrderIds({ userId, listingId }) {
  // Eligible = placed an order that isn't cancelled AND hasn't been reviewed yet.
  // Order-based 1 review (duplicate prevented by uniq index).
  const rows = await query(
    `SELECT o.id
     FROM orders o
     LEFT JOIN listing_reviews r ON r.order_id = o.id
     WHERE o.buyer_user_id = ?
       AND o.listing_id = ?
       AND o.status <> 'cancelled'
       AND r.id IS NULL
     ORDER BY o.created_at DESC`,
    [userId, listingId]
  )
  return (rows || []).map(r => Number(r.id)).filter(Boolean)
}

export async function GET(request, { params }) {
  if (!isConfigured()) return NextResponse.json({ reviews: [], summary: { count: 0, avg: 0 }, _unconfigured: true })
  try {
    await ensureReviewsTable()
    // Next.js (newer versions) may pass `params` as a Promise.
    const { id } = await params
    const listingId = parseInt(id)
    if (!listingId) return NextResponse.json({ reviews: [], summary: { count: 0, avg: 0 } })

    const [summaryRow] = await query(
      `SELECT COUNT(*) AS cnt, COALESCE(AVG(rating), 0) AS avg_rating
       FROM listing_reviews
       WHERE listing_id = ?`,
      [listingId]
    )
    const summary = {
      count: Number(summaryRow?.cnt) || 0,
      avg: Number(summaryRow?.avg_rating) || 0,
    }

    const url = new URL(request.url)
    const sort = (url.searchParams.get('sort') || 'newest').toLowerCase()
    const orderBy = sort === 'stars'
      ? 'r.rating DESC, r.created_at DESC'
      : 'r.created_at DESC'

    const rows = await query(
      `SELECT r.id, r.listing_id, r.order_id, r.buyer_user_id, r.rating, r.message, r.created_at,
              u.name AS buyer_name
       FROM listing_reviews r
       LEFT JOIN users u ON u.id = r.buyer_user_id
       WHERE r.listing_id = ?
       ORDER BY ${orderBy}`,
      [listingId]
    )

    const me = url.searchParams.get('me')
    if (me) {
      const user = await getCurrentUser().catch(() => null)
      if (!user) {
        return NextResponse.json({ reviews: rows || [], summary, me: { canReview: false, reason: 'LOGIN_REQUIRED', pendingOrderIds: [] } })
      }
      const pendingOrderIds = await getEligibleOrderIds({ userId: user.id, listingId })
      return NextResponse.json({
        reviews: rows || [],
        summary,
        me: {
          canReview: pendingOrderIds.length > 0,
          pendingOrderIds,
          reason: pendingOrderIds.length > 0 ? null : 'NOT_VERIFIED_PURCHASE',
        },
      })
    }

    return NextResponse.json({ reviews: rows || [], summary })
  } catch (err) {
    console.error('[GET /api/listings/:id/reviews]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(request, { params }) {
  if (!isConfigured()) return NextResponse.json({ error: 'Unconfigured' }, { status: 400 })
  try {
    await ensureReviewsTable()
    const user = await getCurrentUser().catch(() => null)
    if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

    // Next.js (newer versions) may pass `params` as a Promise.
    const { id } = await params
    const listingId = parseInt(id)
    if (!listingId) return NextResponse.json({ error: 'Invalid listing id' }, { status: 400 })

    const body = await request.json().catch(() => ({}))
    const rating = clampRating(body?.rating)
    const message = (body?.message || '').toString().trim()
    const orderIdInput = body?.orderId

    if (!rating || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const eligibleOrderIds = await getEligibleOrderIds({ userId: user.id, listingId })
    if (eligibleOrderIds.length === 0) {
      return NextResponse.json({ error: 'NOT_VERIFIED_PURCHASE' }, { status: 403 })
    }

    const orderId = orderIdInput ? Number(orderIdInput) : eligibleOrderIds[0]
    if (!eligibleOrderIds.includes(orderId)) {
      return NextResponse.json({ error: 'INVALID_ORDER' }, { status: 400 })
    }

    try {
      const result = await query(
        `INSERT INTO listing_reviews (listing_id, order_id, buyer_user_id, rating, message)
         VALUES (?, ?, ?, ?, ?)`,
        [listingId, orderId, user.id, rating, message]
      )
      return NextResponse.json({ id: result.insertId }, { status: 201 })
    } catch (e) {
      // Duplicate order review (unique key)
      if (String(e?.code || '').toLowerCase().includes('duplicate') || String(e?.message || '').toLowerCase().includes('duplicate')) {
        return NextResponse.json({ error: 'DUPLICATE' }, { status: 409 })
      }
      throw e
    }
  } catch (err) {
    console.error('[POST /api/listings/:id/reviews]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}