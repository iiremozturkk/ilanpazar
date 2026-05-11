import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { query, queryOne, isConfigured } from '@/lib/db'

async function requireAdmin() {
  const session = await getSession()
  if (!session.admin) return null
  return true
}

export async function PATCH(_request, { params }) {
  if (!isConfigured()) {
    return NextResponse.json({ error: 'Unconfigured' }, { status: 500 })
  }
  try {
    if (!await requireAdmin()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: rawId } = await params
    const id = Number(rawId)
    const body = await _request.json().catch(() => ({}))
    const status = body?.status

    if (!id || Number.isNaN(id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
    }
    if (status !== 'open' && status !== 'reviewed') {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const exists = await queryOne('SELECT id FROM listing_reports WHERE id = ? LIMIT 1', [id])
    if (!exists) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await query('UPDATE listing_reports SET status = ? WHERE id = ?', [status, id])
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[admin/reports PATCH]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(_request, { params }) {
  if (!isConfigured()) {
    return NextResponse.json({ error: 'Unconfigured' }, { status: 500 })
  }
  try {
    if (!await requireAdmin()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: rawId } = await params
    const id = Number(rawId)
    if (!id || Number.isNaN(id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
    }

    await query('DELETE FROM listing_reports WHERE id = ?', [id])
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[admin/reports DELETE]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
