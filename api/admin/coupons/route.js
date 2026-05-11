import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { query, isConfigured } from '@/lib/db'

async function requireAdmin() {
  const session = await getSession()
  if (!session.admin) return false
  return true
}

// GET /api/admin/coupons — list coupons
export async function GET() {
  if (!isConfigured()) {
    return NextResponse.json({ coupons: [], _unconfigured: true })
  }
  try {
    if (!await requireAdmin()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const coupons = await query(
      `SELECT id, code, type, value, min_subtotal, is_public, max_uses, used_count,
              starts_at, expires_at, active, created_at
       FROM coupons
       ORDER BY created_at DESC
       LIMIT 500`
    )
    return NextResponse.json({ coupons: Array.isArray(coupons) ? coupons : [] })
  } catch (err) {
    console.error('[admin/coupons GET]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST /api/admin/coupons — create coupon
export async function POST(req) {
  if (!isConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }
  try {
    if (!await requireAdmin()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const body = await req.json().catch(() => ({}))
    const code = String(body?.code || '').trim().toUpperCase()
    if (!code) return NextResponse.json({ error: 'CODE_REQUIRED' }, { status: 400 })
    const type = body?.type === 'fixed' ? 'fixed' : 'percent'
    const value = Number(body?.value) || 0
    const minSubtotal = Number(body?.min_subtotal) || 0
    const isPublic = body?.is_public ? 1 : 0
    const maxUses = body?.max_uses == null || body.max_uses === '' ? null : Number(body.max_uses)
    const startsAt = body?.starts_at || null
    const expiresAt = body?.expires_at || null
    const active = body?.active ? 1 : 0

    // Prevent duplicates
    const existing = await query(`SELECT id FROM coupons WHERE code = ? LIMIT 1`, [code])
    if (Array.isArray(existing) && existing[0]) {
      return NextResponse.json({ error: 'DUPLICATE_CODE' }, { status: 409 })
    }

    const res = await query(
      `INSERT INTO coupons (code, type, value, min_subtotal, is_public, max_uses, starts_at, expires_at, active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      , [code, type, value, minSubtotal, isPublic, maxUses, startsAt, expiresAt, active]
    )

    const id = res?.insertId
    const rows = await query(
      `SELECT id, code, type, value, min_subtotal, is_public, max_uses, used_count,
              starts_at, expires_at, active, created_at
       FROM coupons WHERE id = ? LIMIT 1`,
      [id]
    )
    const coupon = Array.isArray(rows) ? rows[0] : null
    return NextResponse.json({ ok: true, coupon }, { status: 201 })
  } catch (err) {
    console.error('[admin/coupons POST]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
