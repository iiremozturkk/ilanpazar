import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'

// Admin login: checks against ADMIN_PASSWORD env var
export async function POST(request) {
  try {
    const { password } = await request.json()

    if (!password) {
      return NextResponse.json({ error: 'Password required' }, { status: 400 })
    }

    // In production, ADMIN_PASSWORD must be set.
    // In development, fall back to a default to prevent "500 Admin not configured".
    const adminPassword =
      process.env.ADMIN_PASSWORD ||
      (process.env.NODE_ENV !== 'production' ? 'Admin12345' : null)

    if (!adminPassword) {
      return NextResponse.json(
        { error: 'Admin not configured. Set ADMIN_PASSWORD in environment.' },
        { status: 500 }
      )
    }

    if (password !== adminPassword) {
      return NextResponse.json({ error: 'INVALID_PASSWORD' }, { status: 401 })
    }

    const session = await getSession()
    session.admin = true
    await session.save()

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[admin/login]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const session = await getSession()
    session.admin = false
    await session.save()
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[admin/logout]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
