import { query } from '@/lib/db'

export async function GET() {
  try {
    const rows = await query(
      `SELECT COALESCE(NULLIF(category, ''), 'other') AS category, COUNT(*) AS cnt
       FROM listings
       WHERE COALESCE(NULLIF(status, ''), 'active') <> 'passive'
       GROUP BY COALESCE(NULLIF(category, ''), 'other')`
    )

    const counts = {}
    for (const r of rows) {
      counts[r.category] = Number(r.cnt || 0)
    }

    return Response.json({ counts })
  } catch (e) {
    return Response.json({ counts: {} }, { status: 200 })
  }
}
