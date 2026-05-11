import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getCurrentUser, getSession } from '@/lib/session'
import { isConfigured, query } from '@/lib/db'

// GET /api/profile
export async function GET() {
  try {
    const user = await getCurrentUser().catch(() => null)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!isConfigured()) return NextResponse.json({ error: 'DB not configured', _unconfigured: true }, { status: 503 })

    let rows
    try {
      rows = await query('SELECT id, name, email, phone, avatar_url FROM users WHERE id = ? LIMIT 1', [user.id])
    } catch {
      rows = await query('SELECT id, name, email, phone FROM users WHERE id = ? LIMIT 1', [user.id])
    }
    const u = Array.isArray(rows) ? rows[0] : null
    return NextResponse.json({ user: u || null })
  } catch (e) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}

// PUT /api/profile
// Body: { name?: string, phone?: string, avatarUrl?: string | null, currentPassword?: string, newPassword?: string }
export async function PUT(req) {
  try {
    const user = await getCurrentUser().catch(() => null)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!isConfigured()) return NextResponse.json({ error: 'DB not configured', _unconfigured: true }, { status: 503 })

    const body = await req.json().catch(() => ({}))
    const name = typeof body?.name === 'string' ? body.name.trim() : null
    const phone = typeof body?.phone === 'string' ? body.phone.trim() : null
    const avatarUrl = typeof body?.avatarUrl === 'string' ? body.avatarUrl.trim() : null
    const currentPassword = typeof body?.currentPassword === 'string' ? body.currentPassword : ''
    const newPassword = typeof body?.newPassword === 'string' ? body.newPassword : ''

    if (!name) return NextResponse.json({ error: 'NAME_REQUIRED' }, { status: 400 })

    // If password change requested, verify current password.
    if (newPassword) {
      if (newPassword.length < 6) return NextResponse.json({ error: 'PASSWORD_MIN' }, { status: 400 })
      const rows = await query('SELECT password_hash FROM users WHERE id = ? LIMIT 1', [user.id])
      const u = Array.isArray(rows) ? rows[0] : null
      if (!u?.password_hash) return NextResponse.json({ error: 'USER_NOT_FOUND' }, { status: 404 })
      const ok = await bcrypt.compare(currentPassword || '', u.password_hash)
      if (!ok) return NextResponse.json({ error: 'INVALID_PASSWORD' }, { status: 400 })

      const hash = await bcrypt.hash(newPassword, 10)
      try {
        await query('UPDATE users SET name = ?, phone = ?, avatar_url = ?, password_hash = ? WHERE id = ?', [name, phone || null, avatarUrl || null, hash, user.id])
      } catch {
        await query('UPDATE users SET name = ?, phone = ?, password_hash = ? WHERE id = ?', [name, phone || null, hash, user.id])
      }
    } else {
      try {
        await query('UPDATE users SET name = ?, phone = ?, avatar_url = ? WHERE id = ?', [name, phone || null, avatarUrl || null, user.id])
      } catch {
        await query('UPDATE users SET name = ?, phone = ? WHERE id = ?', [name, phone || null, user.id])
      }
    }

    // Update session user name/phone/avatar in cookie.
    const session = await getSession()
    session.user = { ...(session.user || {}), name, phone: phone || null, avatar_url: avatarUrl || null }
    await session.save()

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}
