import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/session'
import { isConfigured, query, queryOne } from '@/lib/db'

// GET /api/favorites
// Returns user's favorite listing ids (and basic listing data for convenience).
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ ids: [] })

    if (!isConfigured()) {
      return NextResponse.json({ ids: [], _unconfigured: true })
    }

    const rows = await query(
      `SELECT f.listing_id
       FROM listing_favorites f
       WHERE f.user_id = ?
       ORDER BY f.created_at DESC`,
      [user.id]
    )
    const ids = Array.isArray(rows) ? rows.map(r => Number(r.listing_id)).filter(Boolean) : []

    // Optional: include listing cards for a potential /favorites page.
    const listings = ids.length
      ? await query(
          `SELECT id, title, price, stock, category, location, cover_image, views, created_at
           FROM listings
           WHERE id IN (${ids.map(() => '?').join(',')})
           ORDER BY FIELD(id, ${ids.map(() => '?').join(',')})`,
          [...ids, ...ids]
        )
      : []

    return NextResponse.json({ ids, listings })
  } catch (e) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}

// POST /api/favorites  { listingId }
// Toggle favorite.
export async function POST(req) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!isConfigured()) return NextResponse.json({ error: 'DB not configured', _unconfigured: true }, { status: 500 })

    const body = await req.json().catch(() => ({}))
    const listingId = Number(body?.listingId)
    if (!listingId) return NextResponse.json({ error: 'listingId is required' }, { status: 400 })

    // Ensure listing exists.
    const listing = await queryOne('SELECT id FROM listings WHERE id = ? LIMIT 1', [listingId])
    if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })

    const existing = await queryOne(
      'SELECT id FROM listing_favorites WHERE user_id = ? AND listing_id = ? LIMIT 1',
      [user.id, listingId]
    )

    if (existing?.id) {
      await query('DELETE FROM listing_favorites WHERE id = ? LIMIT 1', [existing.id])
      return NextResponse.json({ favorite: false })
    }

    await query(
      'INSERT INTO listing_favorites (user_id, listing_id) VALUES (?, ?)',
      [user.id, listingId]
    )
    return NextResponse.json({ favorite: true })
  } catch (e) {
    // Unique constraint race -> treat as already favorited.
    if (String(e?.code) === 'ER_DUP_ENTRY') {
      return NextResponse.json({ favorite: true })
    }
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}
