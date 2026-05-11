import { NextResponse } from 'next/server'
import db from '@/lib/db'
import { getCurrentUser } from '@/lib/session'

// NextResponse.json cannot serialize BigInt (e.g. MySQL BIGINT) values.
// This helper ensures API responses are always JSON-serializable.
function safeJson(x) {
  return JSON.parse(
    JSON.stringify(x, (_k, v) => (typeof v === 'bigint' ? v.toString() : v))
  )
}

async function ensureTables() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS listing_conversations (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      listing_id BIGINT UNSIGNED NOT NULL,
      buyer_user_id BIGINT UNSIGNED NOT NULL,
      seller_user_id BIGINT UNSIGNED NOT NULL,
      last_message_at TIMESTAMP NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uniq_listing_conversation (listing_id, buyer_user_id, seller_user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `)
  await db.query(`
    CREATE TABLE IF NOT EXISTS listing_offers (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      conversation_id BIGINT UNSIGNED NOT NULL,
      listing_id BIGINT UNSIGNED NOT NULL,
      buyer_user_id BIGINT UNSIGNED NOT NULL,
      seller_user_id BIGINT UNSIGNED NOT NULL,
      amount DECIMAL(12,2) NOT NULL,
      status ENUM('pending','accepted','rejected','countered') NOT NULL DEFAULT 'pending',
      counter_amount DECIMAL(12,2) NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_offers_conversation_created (conversation_id, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `)
  await db.query(`
    CREATE TABLE IF NOT EXISTS conversation_messages (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      conversation_id BIGINT UNSIGNED NOT NULL,
      sender_user_id BIGINT UNSIGNED NOT NULL,
      receiver_user_id BIGINT UNSIGNED NOT NULL,
      message TEXT NOT NULL,
      read_at TIMESTAMP NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_messages_conversation_created (conversation_id, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `)
}

async function getConversation(convId, userId) {
  const c = await db.queryOne(
    `
    SELECT c.*, l.title AS listing_title, l.cover_image,
           u1.name AS buyer_name, u2.name AS seller_name
    FROM listing_conversations c
    JOIN listings l ON l.id = c.listing_id
    JOIN users u1 ON u1.id = c.buyer_user_id
    JOIN users u2 ON u2.id = c.seller_user_id
    WHERE c.id = ? AND (c.buyer_user_id = ? OR c.seller_user_id = ?)
    LIMIT 1
    `,
    [convId, userId, userId]
  )
  return c
}

export async function GET(_req, { params }) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await ensureTables()

    // Keep ids as strings to avoid JS number precision issues.
    const { id } = await params
    const convId = String(id || '')
    if (!/^\d+$/.test(convId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

    const conv = await getConversation(convId, user.id)
    if (!conv) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const messages = await db.query(
      `
      SELECT id, conversation_id, sender_user_id, receiver_user_id, message, read_at, created_at
      FROM conversation_messages
      WHERE conversation_id = ?
      ORDER BY created_at ASC
      `,
      [convId]
    )

    const offers = await db.query(
      `SELECT id, conversation_id, listing_id, buyer_user_id, seller_user_id, amount, status, counter_amount, created_at, updated_at
       FROM listing_offers
       WHERE conversation_id = ?
       ORDER BY created_at DESC
       LIMIT 20`,
      [convId]
    ).catch(() => [])


    // Median response time of the other party (seconds) relative to current user's messages
    const deltas = []
    for (let i = 0; i < messages.length - 1; i++) {
      const a = messages[i]
      const b = messages[i + 1]
      if (Number(a.sender_user_id) === Number(user.id) && Number(b.sender_user_id) !== Number(user.id)) {
        const dt = (new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) / 1000
        if (dt > 0 && dt < 60 * 60 * 24 * 7) deltas.push(dt)
      }
    }
    let responseTime = null
    if (deltas.length) {
      deltas.sort((x, y) => x - y)
      const mid = Math.floor(deltas.length / 2)
      responseTime = deltas.length % 2 ? deltas[mid] : (deltas[mid - 1] + deltas[mid]) / 2
    }

    return NextResponse.json(
      safeJson({ conversation: conv, messages, offers, response_time_seconds: responseTime })
    )
  } catch (e) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}

// Send a message
// Body: { message }
export async function POST(req, { params }) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await ensureTables()

    // Keep ids as strings to avoid JS number precision issues.
    const { id } = await params
    const convId = String(id || '')
    if (!/^\d+$/.test(convId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

    const conv = await getConversation(convId, user.id)
    if (!conv) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = await req.json().catch(() => ({}))
    const text = String(body?.message || '').trim()
    if (!text) return NextResponse.json({ error: 'message required' }, { status: 400 })
    if (text.length > 2000) return NextResponse.json({ error: 'message too long' }, { status: 400 })

    const senderId = Number(user.id)
    const receiverId = senderId === Number(conv.buyer_user_id) ? Number(conv.seller_user_id) : Number(conv.buyer_user_id)

    const res = await db.query(
      `INSERT INTO conversation_messages (conversation_id, sender_user_id, receiver_user_id, message)
       VALUES (?, ?, ?, ?)`,
      [convId, senderId, receiverId, text]
    )

    await db.query(
      `UPDATE listing_conversations SET last_message_at = NOW() WHERE id = ?`,
      [convId]
    )

    // Notify receiver (lightweight)
    await db.query(
      `
      INSERT INTO user_notifications (user_id, type, title, message, link)
      VALUES (?, 'message', 'Yeni mesaj', ?, ?)
      `,
      [receiverId, text.slice(0, 160), `/messages/${convId}`]
    ).catch(() => {})

    return NextResponse.json(safeJson({ ok: true, id: res.insertId }))
  } catch (e) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}
