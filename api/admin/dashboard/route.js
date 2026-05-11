import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { query, isConfigured } from '@/lib/db'

async function requireAdmin() {
  const session = await getSession()
  return session.admin ? true : null
}

async function safeQuery(sql, fallback) {
  try {
    return await query(sql)
  } catch (err) {
    console.error('[admin/dashboard safeQuery]', err)
    return fallback
  }
}

// GET /api/admin/dashboard
// Provides "status screen" data:
// - today / this week KPIs
// - last 10 activity items
// - daily trends (listings & sales)
export async function GET() {
  if (!isConfigured()) {
    return NextResponse.json({
      kpis: null,
      activity: [],
      trends: { days: [], listings: [], sales: [] },
      _unconfigured: true,
    })
  }

  try {
    if (!await requireAdmin()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const [todayRow = {}] = await safeQuery(
      `SELECT
        (SELECT COUNT(*) FROM listings WHERE DATE(created_at) = CURDATE()) as new_listings,
        (SELECT COUNT(*) FROM orders WHERE DATE(created_at) = CURDATE()) as sales,
        (SELECT COUNT(*) FROM orders WHERE status = 'cancelled' AND DATE(created_at) = CURDATE()) as cancels,
        (SELECT COUNT(*) FROM orders WHERE status = 'returned' AND DATE(created_at) = CURDATE()) as returns_count,
        (SELECT COUNT(DISTINCT x.user_id) FROM (
          SELECT user_id, created_at FROM listings WHERE DATE(created_at) = CURDATE()
          UNION ALL
          SELECT COALESCE(buyer_user_id, seller_user_id) as user_id, created_at FROM orders WHERE DATE(created_at) = CURDATE()
        ) x) as active_users
      `,
      [{}]
    )

    const [weekRow = {}] = await safeQuery(
      `SELECT
        (SELECT COUNT(*) FROM listings WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY) AND created_at < DATE_ADD(CURDATE(), INTERVAL 1 DAY)) as new_listings,
        (SELECT COUNT(*) FROM orders WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY) AND created_at < DATE_ADD(CURDATE(), INTERVAL 1 DAY)) as sales,
        (SELECT COUNT(*) FROM orders WHERE status = 'cancelled' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY) AND created_at < DATE_ADD(CURDATE(), INTERVAL 1 DAY)) as cancels,
        (SELECT COUNT(*) FROM orders WHERE status = 'returned' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY) AND created_at < DATE_ADD(CURDATE(), INTERVAL 1 DAY)) as returns_count,
        (SELECT COUNT(DISTINCT x.user_id) FROM (
          SELECT user_id, created_at FROM listings WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY) AND created_at < DATE_ADD(CURDATE(), INTERVAL 1 DAY)
          UNION ALL
          SELECT COALESCE(buyer_user_id, seller_user_id) as user_id, created_at FROM orders WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY) AND created_at < DATE_ADD(CURDATE(), INTERVAL 1 DAY)
        ) x) as active_users
      `,
      [{}]
    )

    const activity = await safeQuery(
      `(
        SELECT
          'order' as type,
          CONCAT('Sipariş #', o.id) as title,
          CONCAT(COALESCE(u.name, 'Misafir'), ' • ', COALESCE(l.title,'')) as meta,
          o.created_at as created_at,
          CONCAT('/listings/', o.listing_id) as link
        FROM orders o
        LEFT JOIN users u ON o.buyer_user_id = u.id
        LEFT JOIN listings l ON o.listing_id = l.id
      )
      UNION ALL
      (
        SELECT
          'listing' as type,
          'Yeni ilan' as title,
          CONCAT(COALESCE(u.name,''), ' • ', l.title) as meta,
          l.created_at as created_at,
          CONCAT('/listings/', l.id) as link
        FROM listings l
        LEFT JOIN users u ON l.user_id = u.id
      )
      UNION ALL
      (
        SELECT
          'report' as type,
          'Şikayet' as title,
          CONCAT('İlan #', r.listing_id, ' • ', LEFT(r.reason, 60)) as meta,
          r.created_at as created_at,
          CONCAT('/listings/', r.listing_id) as link
        FROM listing_reports r
      )
      ORDER BY created_at DESC
      LIMIT 10`,
      []
    )

    const days = await safeQuery(
      `SELECT DATE_FORMAT(d.day, '%Y-%m-%d') as day
       FROM (
         SELECT CURDATE() - INTERVAL 13 DAY as day
         UNION ALL SELECT CURDATE() - INTERVAL 12 DAY
         UNION ALL SELECT CURDATE() - INTERVAL 11 DAY
         UNION ALL SELECT CURDATE() - INTERVAL 10 DAY
         UNION ALL SELECT CURDATE() - INTERVAL 9 DAY
         UNION ALL SELECT CURDATE() - INTERVAL 8 DAY
         UNION ALL SELECT CURDATE() - INTERVAL 7 DAY
         UNION ALL SELECT CURDATE() - INTERVAL 6 DAY
         UNION ALL SELECT CURDATE() - INTERVAL 5 DAY
         UNION ALL SELECT CURDATE() - INTERVAL 4 DAY
         UNION ALL SELECT CURDATE() - INTERVAL 3 DAY
         UNION ALL SELECT CURDATE() - INTERVAL 2 DAY
         UNION ALL SELECT CURDATE() - INTERVAL 1 DAY
         UNION ALL SELECT CURDATE()
       ) d
       ORDER BY d.day ASC`,
      []
    )

    const listingCounts = await safeQuery(
      `SELECT DATE(created_at) as day, COUNT(*) as c
       FROM listings
       WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 13 DAY)
       GROUP BY DATE(created_at)`,
      []
    )

    const salesCounts = await safeQuery(
      `SELECT DATE(created_at) as day, COUNT(*) as c
       FROM orders
       WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 13 DAY)
       GROUP BY DATE(created_at)`,
      []
    )

    const toMap = (rows) => {
      const m = new Map()
      for (const r of rows || []) {
        const key = r.day instanceof Date ? r.day.toISOString().slice(0, 10) : String(r.day)
        m.set(key, Number(r.c) || 0)
      }
      return m
    }
    const lMap = toMap(listingCounts)
    const sMap = toMap(salesCounts)
    const dayList = (days || []).map((d) => d.day)
    const listingsSeries = dayList.map((d) => lMap.get(d) ?? 0)
    const salesSeries = dayList.map((d) => sMap.get(d) ?? 0)

    return NextResponse.json({
      kpis: {
        today: todayRow,
        week: weekRow,
      },
      activity,
      trends: { days: dayList, listings: listingsSeries, sales: salesSeries },
      notes: {
        returns: 'İade sayacı varsa returned durumuna göre hesaplanır.',
      },
    })
  } catch (err) {
    console.error('[admin/dashboard GET]', err)
    return NextResponse.json({
      kpis: { today: {}, week: {} },
      activity: [],
      trends: { days: [], listings: [], sales: [] },
      error: 'Server error',
    }, { status: 200 })
  }
}
