import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { query, isConfigured } from '@/lib/db'

async function requireAdmin() {
  const session = await getSession()
  if (!session.admin) return null
  return true
}

// GET /api/admin/listings — all listings with user info
export async function GET() {
  if (!isConfigured()) {
    return NextResponse.json({ listings: [], _unconfigured: true })
  }
  try {
    if (!await requireAdmin()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Be tolerant to older schemas without is_approved.
    let listings
    try {
      listings = await query(
        `SELECT l.id, l.title, l.price, l.category, l.location, l.status,
                l.description, l.images,
                l.cover_image, l.views, l.created_at,
                l.is_approved,
                u.id as user_id, u.name as seller_name, u.email as seller_email
         FROM listings l
         JOIN users u ON l.user_id = u.id
         ORDER BY l.created_at DESC`
      )
    } catch (e) {
      listings = await query(
        `SELECT l.id, l.title, l.price, l.category, l.location, l.status,
                l.description, l.images,
                l.cover_image, l.views, l.created_at,
                1 as is_approved,
                u.id as user_id, u.name as seller_name, u.email as seller_email
         FROM listings l
         JOIN users u ON l.user_id = u.id
         ORDER BY l.created_at DESC`
      )
    }

    return NextResponse.json({ listings })
  } catch (err) {
    console.error('[admin/listings GET]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
