import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getSession } from '@/lib/session'
import { queryOne, isConfigured } from '@/lib/db'

export async function POST(request) {
  if (!isConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    // Be tolerant to older schemas without is_blocked.
    let user
    try {
      user = await queryOne(
        'SELECT id, name, email, avatar_url, password_hash, is_blocked FROM users WHERE email = ?',
        [email.toLowerCase().trim()]
      )
    } catch {
      user = await queryOne(
        'SELECT id, name, email, avatar_url, password_hash FROM users WHERE email = ?',
        [email.toLowerCase().trim()]
      )
    }

    if (!user) {
      return NextResponse.json({ error: 'INVALID_CREDENTIALS' }, { status: 401 })
    }

    if (user.is_blocked) {
      return NextResponse.json({ error: 'USER_BLOCKED' }, { status: 403 })
    }

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) {
      return NextResponse.json({ error: 'INVALID_CREDENTIALS' }, { status: 401 })
    }

    const sessionUser = { id: user.id, name: user.name, email: user.email, avatar_url: user.avatar_url || null }
    const session = await getSession()
    session.user = sessionUser
    await session.save()

    return NextResponse.json({ user: sessionUser })
  } catch (err) {
    console.error('[login]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
