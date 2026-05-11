import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { query } from '@/lib/db'

async function requireAdmin() {
  const session = await getSession()
  return session.admin ? true : null
}

// PATCH /api/admin/listings/[id]
// - update status (active/passive)
// - approve/unapprove (is_approved)
// DELETE /api/admin/listings/[id] — delete listing

export async function PATCH(request, { params }) {
  try {
    if (!await requireAdmin()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json().catch(() => ({}))

    const updates = []
    const values = []

    if (typeof body.status === 'string') {
      const status = body.status
      if (!['active', 'passive'].includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
      }
      updates.push('status = ?')
      values.push(status)
    }

    const approvalValue = typeof body.is_approved === 'boolean' ? body.is_approved : (body.is_approved === 1 || body.is_approved === '1' ? true : (body.is_approved === 0 || body.is_approved === '0' ? false : null))

    if (approvalValue !== null) {
      updates.push('is_approved = ?')
      values.push(approvalValue ? 1 : 0)
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No updates' }, { status: 400 })
    }

    values.push(id)

    try {
      await query(`UPDATE listings SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, values)
    } catch (e) {
      // If schema doesn't have is_approved, return a conflict for that case.
      if (approvalValue !== null) {
        return NextResponse.json({ error: 'SCHEMA_MISSING_IS_APPROVED' }, { status: 409 })
      }
      throw e
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[admin/listings PATCH]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    if (!await requireAdmin()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    await query('DELETE FROM listings WHERE id = ?', [id])
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[admin/listings DELETE]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
