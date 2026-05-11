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
      UNIQUE KEY uniq_listing_conversation (listing_id, buyer_user_id, seller_user_id),
      KEY idx_conversations_buyer_last (buyer_user_id, last_message_at),
      KEY idx_conversations_seller_last (seller_user_id, last_message_at)
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
      KEY idx_messages_conversation_created (conversation_id, created_at),
      KEY idx_messages_receiver_read (receiver_user_id, read_at, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `)
}

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await ensureTables()

    const rows = await db.query(
      `
      SELECT c.id, c.listing_id, c.buyer_user_id, c.seller_user_id, c.last_message_at, c.created_at,
             l.title AS listing_title, l.cover_image,
             u1.name AS buyer_name, u2.name AS seller_name,
             (
               SELECT m.message FROM conversation_messages m
               WHERE m.conversation_id = c.id
               ORDER BY m.created_at DESC
               LIMIT 1
             ) AS last_message,
             (
               SELECT m.sender_user_id FROM conversation_messages m
               WHERE m.conversation_id = c.id
               ORDER BY m.created_at DESC
               LIMIT 1
             ) AS last_message_sender_id,
             (
               SELECT m.read_at FROM conversation_messages m
               WHERE m.conversation_id = c.id
               ORDER BY m.created_at DESC
               LIMIT 1
             ) AS last_message_read_at,
             (
               SELECT COUNT(*) FROM conversation_messages m
               WHERE m.conversation_id = c.id
                 AND m.receiver_user_id = ?
                 AND m.read_at IS NULL
             ) AS unread_count
      FROM listing_conversations c
      JOIN listings l ON l.id = c.listing_id
      JOIN users u1 ON u1.id = c.buyer_user_id
      JOIN users u2 ON u2.id = c.seller_user_id
      WHERE c.buyer_user_id = ? OR c.seller_user_id = ?
      ORDER BY COALESCE(c.last_message_at, c.created_at) DESC
      `,
      [user.id, user.id, user.id]
    )

    // Quick response time estimation (median response time of the other party)
    const convIds = rows.map(r => r.id)
    let responseTimes = {}
    if (convIds.length) {
      // Pull last ~200 messages per conversation for lightweight stats
      const msgs = await db.query(
        `
        SELECT conversation_id, sender_user_id, created_at
        FROM conversation_messages
        WHERE conversation_id IN (${convIds.map(() => '?').join(',')})
        ORDER BY conversation_id ASC, created_at ASC
        `,
        convIds
      )

      // Compute response time of the OTHER party relative to user's messages
      for (const convId of convIds) {
        const arr = msgs.filter(m => m.conversation_id === convId)
        const deltas = []
        for (let i = 0; i < arr.length - 1; i++) {
          const a = arr[i]
          const b = arr[i + 1]
          if (a.sender_user_id === user.id && b.sender_user_id !== user.id) {
            const dt = (new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) / 1000
            if (dt > 0 && dt < 60 * 60 * 24 * 7) deltas.push(dt)
          }
        }
        if (deltas.length) {
          deltas.sort((x, y) => x - y)
          const mid = Math.floor(deltas.length / 2)
          const median = deltas.length % 2 ? deltas[mid] : (deltas[mid - 1] + deltas[mid]) / 2
          responseTimes[convId] = median
        }
      }
    }

    const conversations = rows.map(r => ({
      ...r,
      response_time_seconds: responseTimes[r.id] ?? null,
    }))

    return NextResponse.json(safeJson({ conversations }))
  } catch (e) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}

// Create/get conversation for a listing
// Body: { listingId }
export async function POST(req) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await ensureTables()

    const body = await req.json().catch(() => ({}))
    const listingId = Number(body?.listingId)
    if (!listingId) return NextResponse.json({ error: 'listingId required' }, { status: 400 })

    const listing = await db.queryOne(
      `SELECT id, user_id AS seller_user_id FROM listings WHERE id = ? LIMIT 1`,
      [listingId]
    )
    if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    if (Number(listing.seller_user_id) === Number(user.id)) {
      return NextResponse.json({ error: 'Cannot message your own listing' }, { status: 400 })
    }

    // buyer = current user, seller = listing owner
    const buyerId = Number(user.id)
    const sellerId = Number(listing.seller_user_id)

    // Upsert conversation
    const existing = await db.queryOne(
      `SELECT id FROM listing_conversations WHERE listing_id = ? AND buyer_user_id = ? AND seller_user_id = ? LIMIT 1`,
      [listingId, buyerId, sellerId]
    )

    if (existing?.id) {
      return NextResponse.json(safeJson({ conversationId: existing.id }))
    }

    const res = await db.query(
      `INSERT INTO listing_conversations (listing_id, buyer_user_id, seller_user_id, last_message_at)
       VALUES (?, ?, ?, NULL)`,
      [listingId, buyerId, sellerId]
    )

    return NextResponse.json(safeJson({ conversationId: res.insertId }))
  } catch (e) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}
