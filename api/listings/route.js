import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/session'
import { query, isConfigured } from '@/lib/db'

const PAGE_SIZE = 12

export async function GET(request) {
  if (!isConfigured()) {
    return NextResponse.json({
      listings: [],
      pagination: { page: 1, pageSize: PAGE_SIZE, total: 0, totalPages: 0 },
      _unconfigured: true,
    })
  }

  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || ''
    const q = searchParams.get('q') || ''
    const minPrice = searchParams.get('minPrice') || ''
    const maxPrice = searchParams.get('maxPrice') || ''
    const sort = searchParams.get('sort') || 'newest'
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const offset = (page - 1) * PAGE_SIZE

    // Public feed: hide passive and (if available) hide unapproved.
    let conditions = ["COALESCE(NULLIF(l.status, ''), 'active') <> 'passive'"]
    const params = []

    if (category && category !== 'all') {
      conditions.push('l.category = ?')
      params.push(category)
    }

    if (q.trim()) {
      conditions.push('(l.title LIKE ? OR l.description LIKE ?)')
      params.push(`%${q.trim()}%`, `%${q.trim()}%`)
    }

    if (minPrice) {
      conditions.push('l.price >= ?')
      params.push(parseFloat(minPrice))
    }

    if (maxPrice) {
      conditions.push('l.price <= ?')
      params.push(parseFloat(maxPrice))
    }

    let orderBy = 'ORDER BY l.created_at DESC'
    if (sort === 'price_asc') orderBy = 'ORDER BY l.price ASC'
    else if (sort === 'price_desc') orderBy = 'ORDER BY l.price DESC'

    // First try with approval filter; if schema doesn't have it, fall back.
    const run = async (withApproval) => {
      const cond = [...conditions]
      if (withApproval) cond.push('l.is_approved = 1')
      const where = cond.length ? `WHERE ${cond.join(' AND ')}` : ''

      const countRows = await query(`SELECT COUNT(*) as total FROM listings l ${where}`, params)
      const total = countRows[0]?.total ?? 0

      const rows = await query(
        `SELECT l.id, l.title, l.price, l.stock, l.category, l.location, l.status,
                l.cover_image, l.views, l.created_at,
                COALESCE(u.name, '') as seller_name
         FROM listings l
         LEFT JOIN users u ON l.user_id = u.id
         ${where} ${orderBy} LIMIT ${PAGE_SIZE} OFFSET ${offset}`,
        params
      )

      return { rows, total }
    }

    let rows, total
    try {
      ;({ rows, total } = await run(true))
    } catch (e) {
      ;({ rows, total } = await run(false))
    }

    return NextResponse.json({
      listings: rows,
      pagination: {
        page,
        pageSize: PAGE_SIZE,
        total,
        totalPages: Math.ceil(total / PAGE_SIZE),
      },
    })
  } catch (err) {
    console.error('[GET /api/listings]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Optional: blocked users cannot post.
    try {
      const u = await query('SELECT id, is_blocked FROM users WHERE id = ?', [user.id])
      if (u?.[0]?.is_blocked) {
        return NextResponse.json({ error: 'USER_BLOCKED' }, { status: 403 })
      }
    } catch {}

    const body = await request.json()
    const { title, description, price, stock, category, location, images, coverImage, cover_image, cover_image: coverImageAlt } = body

    if (!title || !description || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const cover = coverImage || cover_image || coverImageAlt || (Array.isArray(images) && images[0]) || null
    const imagesJson = JSON.stringify(Array.isArray(images) ? images : [])

    // Some deployments may have an older schema where `status` enum doesn't include 'active'.
    // Also: if listing approval exists, default to unapproved.
    let result
    try {
      result = await query(
        `INSERT INTO listings (user_id, title, description, price, stock, category, location, status, is_approved, cover_image, images)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'active', 0, ?, ?)`,
        [user.id, title.trim(), description.trim(), parseFloat(price) || 0, Math.floor(parseFloat(stock) || 0), category, location || '', cover, imagesJson]
      )
    } catch (e) {
      try {
        result = await query(
          `INSERT INTO listings (user_id, title, description, price, stock, category, location, status, cover_image, images)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
          [user.id, title.trim(), description.trim(), parseFloat(price) || 0, Math.floor(parseFloat(stock) || 0), category, location || '', cover, imagesJson]
        )
      } catch {
        result = await query(
          `INSERT INTO listings (user_id, title, description, price, stock, category, location, cover_image, images)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [user.id, title.trim(), description.trim(), parseFloat(price) || 0, Math.floor(parseFloat(stock) || 0), category, location || '', cover, imagesJson]
        )
      }
    }

    return NextResponse.json({ id: result.insertId }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/listings]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
