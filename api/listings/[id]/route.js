import { NextResponse } from 'next/server'
import { getCurrentUser, getSession } from '@/lib/session'
import { query, queryOne, isConfigured } from '@/lib/db'

export async function GET(request, { params }) {
  if (!isConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }
  try {
    const { id } = await params

    // Try to read with approval flag; fall back if schema doesn't have it.
    let listing
    let hasApproval = true
    try {
      listing = await queryOne(
        `SELECT l.*, l.is_approved,
                COALESCE(u.name, '') as seller_name,
                COALESCE(u.email, '') as seller_email,
                u.phone as seller_phone,
                u.created_at as seller_since
         FROM listings l
         LEFT JOIN users u ON l.user_id = u.id
         WHERE l.id = ?`,
        [id]
      )
    } catch (e) {
      hasApproval = false
      listing = await queryOne(
        `SELECT l.*,
                COALESCE(u.name, '') as seller_name,
                COALESCE(u.email, '') as seller_email,
                u.phone as seller_phone,
                u.created_at as seller_since
         FROM listings l
         LEFT JOIN users u ON l.user_id = u.id
         WHERE l.id = ?`,
        [id]
      )
    }

    if (!listing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // If listing approval exists, only show unapproved listings to owner/admin.
    if (hasApproval && Number(listing.is_approved) !== 1) {
      const user = await getCurrentUser().catch(() => null)
      const session = await getSession().catch(() => null)
      const isAdmin = Boolean(session?.admin)
      const isOwner = user?.id && Number(user.id) === Number(listing.user_id)
      if (!isAdmin && !isOwner) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }
    }

    // Increment views
    await query('UPDATE listings SET views = views + 1 WHERE id = ?', [id])
    listing.views = (listing.views || 0) + 1

    // Parse images JSON
    if (typeof listing.images === 'string') {
      try { listing.images = JSON.parse(listing.images) } catch { listing.images = [] }
    }

    return NextResponse.json({ listing })
  } catch (err) {
    console.error('[GET listing]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params

    const listing = await queryOne('SELECT id, user_id FROM listings WHERE id = ?', [id])
    if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (listing.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { title, description, price, stock, category, location, images, coverImage, status } = body
    const cover = coverImage || (Array.isArray(images) && images[0]) || null
    const imagesJson = JSON.stringify(Array.isArray(images) ? images : [])

    await query(
      `UPDATE listings SET title=?, description=?, price=?, stock=?, category=?, location=?,
       cover_image=?, images=?, status=? WHERE id=?`,
      [title, description, parseFloat(price) || 0, Math.floor(parseFloat(stock) || 0), category, location || '', cover, imagesJson, status || 'active', id]
    )

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[PUT listing]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params

    const listing = await queryOne('SELECT id, user_id FROM listings WHERE id = ?', [id])
    if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (listing.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await query('DELETE FROM listings WHERE id = ?', [id])
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE listing]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
