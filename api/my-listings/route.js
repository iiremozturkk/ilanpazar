import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/session'
import { query, isConfigured } from '@/lib/db'

export async function GET() {
  if (!isConfigured()) {
    return NextResponse.json({ listings: [], _unconfigured: true })
  }
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const listings = await query(
      `SELECT id, title, price, stock, category, location, status, cover_image, views, created_at
       FROM listings
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [user.id]
    )

    return NextResponse.json({ listings })
  } catch (err) {
    console.error('[my-listings]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
