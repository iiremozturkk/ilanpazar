import { NextResponse } from 'next/server'
import { query, isConfigured } from '@/lib/db'

async function ensureCommentsTable() {
  // Create on-demand so existing deployments don't require manual migration.
  await query(`
    CREATE TABLE IF NOT EXISTS listing_comments (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      listing_id BIGINT UNSIGNED NOT NULL,
      name VARCHAR(120) NOT NULL,
      email VARCHAR(191) NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_listing_comments_listing_id_created_at (listing_id, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `)
}

export async function GET(_request, { params }) {
  if (!isConfigured()) return NextResponse.json({ comments: [], _unconfigured: true })
  try {
    await ensureCommentsTable()
    // Next.js (newer versions) may pass `params` as a Promise.
    const { id } = await params
    const listingId = parseInt(id)
    if (!listingId) return NextResponse.json({ comments: [] })

    const rows = await query(
      `SELECT id, listing_id, name, email, message, created_at
       FROM listing_comments
       WHERE listing_id = ?
       ORDER BY created_at DESC`,
      [listingId]
    )
    return NextResponse.json({ comments: rows })
  } catch (err) {
    console.error('[GET /api/listings/:id/comments]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(request, { params }) {
  if (!isConfigured()) return NextResponse.json({ error: 'Unconfigured' }, { status: 400 })
  try {
    await ensureCommentsTable()
    // Next.js (newer versions) may pass `params` as a Promise.
    const { id } = await params
    const listingId = parseInt(id)
    if (!listingId) return NextResponse.json({ error: 'Invalid listing id' }, { status: 400 })

    const body = await request.json()
    const name = (body?.name || '').toString().trim()
    const email = (body?.email || '').toString().trim()
    const message = (body?.message || '').toString().trim()

    if (!name || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const result = await query(
      `INSERT INTO listing_comments (listing_id, name, email, message)
       VALUES (?, ?, ?, ?)`,
      [listingId, name, email || null, message]
    )

    return NextResponse.json({ id: result.insertId }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/listings/:id/comments]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
