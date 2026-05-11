import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { query, isConfigured } from '@/lib/db'

async function requireAdmin() {
  const session = await getSession()
  if (!session.admin) return false
  return true
}

// PATCH /api/admin/coupons/:id — activate/deactivate
export async function PATCH(req, { params }) {
  if (!isConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }
  try {
    if (!await requireAdmin()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const id = Number(params?.id)
    const body = await req.json().catch(() => ({}))
    const active = body?.active ? 1 : 0
    if (!Number.isFinite(id) || id <= 0) return NextResponse.json({ error: 'BAD_REQUEST' }, { status: 400 })
    await query(`UPDATE coupons SET active = ? WHERE id = ?`, [active, id])
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[admin/coupons PATCH]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
