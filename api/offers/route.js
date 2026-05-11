import { NextResponse } from 'next/server'
import db from '@/lib/db'
import { getCurrentUser } from '@/lib/session'

async function ensureTables() {
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
}

// Create an offer. Also ensures a conversation exists.
// Body: { listingId, amount }
export async function POST(req) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const listingId = Number(body?.listingId)
    const amount = Number(body?.amount)
    if (!listingId || !amount || amount <= 0) {
      return NextResponse.json({ error: 'listingId and valid amount required' }, { status: 400 })
    }

    // Ensure base messaging tables exist via /api/conversations logic (minimal create here)
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
    await ensureTables()

    const listing = await db.queryOne(
      `SELECT id, title, price, user_id AS seller_user_id FROM listings WHERE id = ? LIMIT 1`,
      [listingId]
    )
    if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    if (Number(listing.seller_user_id) === Number(user.id)) {
      return NextResponse.json({ error: 'Cannot offer on your own listing' }, { status: 400 })
    }

    const buyerId = Number(user.id)
    const sellerId = Number(listing.seller_user_id)

    let conv = await db.queryOne(
      `SELECT id FROM listing_conversations WHERE listing_id = ? AND buyer_user_id = ? AND seller_user_id = ? LIMIT 1`,
      [listingId, buyerId, sellerId]
    )
    if (!conv?.id) {
      const ins = await db.query(
        `INSERT INTO listing_conversations (listing_id, buyer_user_id, seller_user_id, last_message_at) VALUES (?, ?, ?, NOW())`,
        [listingId, buyerId, sellerId]
      )
      conv = { id: ins.insertId }
    }

    const offerRes = await db.query(
      `INSERT INTO listing_offers (conversation_id, listing_id, buyer_user_id, seller_user_id, amount)
       VALUES (?, ?, ?, ?, ?)`,
      [conv.id, listingId, buyerId, sellerId, amount]
    )

    const text = `Teklif: ${amount.toLocaleString('tr-TR')} ₺ (İlan: ${listing.title})`
    await db.query(
      `INSERT INTO conversation_messages (conversation_id, sender_user_id, receiver_user_id, message)
       VALUES (?, ?, ?, ?)`,
      [conv.id, buyerId, sellerId, text]
    )
    await db.query(`UPDATE listing_conversations SET last_message_at = NOW() WHERE id = ?`, [conv.id])

    await db.query(
      `INSERT INTO user_notifications (user_id, type, title, message, link)
       VALUES (?, 'offer', 'Yeni teklif', ?, ?)` ,
      [sellerId, text.slice(0, 160), `/messages/${conv.id}`]
    ).catch(() => {})

    return NextResponse.json({ ok: true, offerId: offerRes.insertId, conversationId: conv.id })
  } catch (e) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}
