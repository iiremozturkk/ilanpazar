import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getSession } from '@/lib/session'
import { query, queryOne, isConfigured } from '@/lib/db'

export async function POST(request) {
  if (!isConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }
  try {
    const { name, email, password, phone } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password too short' }, { status: 400 })
    }

    const existing = await queryOne(
      'SELECT id FROM users WHERE email = ?',
      [email.toLowerCase().trim()]
    )
    if (existing) {
      return NextResponse.json({ error: 'EMAIL_EXISTS' }, { status: 409 })
    }

    const hash = await bcrypt.hash(password, 10)
    const result = await query(
      'INSERT INTO users (name, email, password_hash, phone) VALUES (?, ?, ?, ?)',
      [name.trim(), email.toLowerCase().trim(), hash, phone || null]
    )

    const newId = result.insertId
    const newUser = { id: newId, name: name.trim(), email: email.toLowerCase().trim(), avatar_url: null }

    const session = await getSession()
    session.user = newUser
    await session.save()

    return NextResponse.json({ user: newUser }, { status: 201 })
  } catch (err) {
    console.error('[register]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
