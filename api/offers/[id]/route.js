import { NextResponse } from 'next/server'
import db from '@/lib/db'
import { getCurrentUser } from '@/lib/session'

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

function money(n) {
  const x = Number(n)
  if (!Number.isFinite(x)) return ''
  return x.toLocaleString('tr-TR') + ' ₺'
}

// PATCH /api/offers/:id
// Body: { action: 'accept'|'reject'|'counter', counterAmount? }
export async function PATCH(req, { params }) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await ensureTables()

    const { id } = await params
    const offerId = Number(id)
    if (!offerId) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

    const body = await req.json().catch(() => ({}))
    const action = String(body?.action || '')

    const offer = await db.queryOne(
      `SELECT * FROM listing_offers WHERE id = ? LIMIT 1`,
      [offerId]
    )
    if (!offer) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const me = Number(user.id)
    const isBuyer = me === Number(offer.buyer_user_id)
    const isSeller = me === Number(offer.seller_user_id)
    if (!isBuyer && !isSeller) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // State machine:
    // - Seller can: accept/reject/counter when pending
    // - Buyer can: accept/reject when countered
    if (action === 'accept') {
      if (!(isSeller && offer.status === 'pending') && !(isBuyer && offer.status === 'countered')) {
        return NextResponse.json({ error: 'Not allowed' }, { status: 400 })
      }
      await db.query(`UPDATE listing_offers SET status = 'accepted' WHERE id = ?`, [offerId])

      const acceptedAmount = offer.status === 'countered' ? (offer.counter_amount ?? offer.amount) : offer.amount
      const senderId = me
      const receiverId = isSeller ? Number(offer.buyer_user_id) : Number(offer.seller_user_id)
      const msg = isSeller
        ? `Teklif kabul edildi: ${money(acceptedAmount)}`
        : `Karşı teklif kabul edildi: ${money(acceptedAmount)}`

      await db.query(
        `INSERT INTO conversation_messages (conversation_id, sender_user_id, receiver_user_id, message)
         VALUES (?, ?, ?, ?)`,
        [offer.conversation_id, senderId, receiverId, msg]
      )
      await db.query(`UPDATE listing_conversations SET last_message_at = NOW() WHERE id = ?`, [offer.conversation_id])

      await db.query(
        `INSERT INTO user_notifications (user_id, type, title, message, link)
         VALUES (?, 'offer', 'Teklif güncellendi', ?, ?)`,
        [receiverId, msg.slice(0, 160), `/messages/${offer.conversation_id}`]
      ).catch(() => {})

      return NextResponse.json({ ok: true })
    }

    if (action === 'reject') {
      if (!(isSeller && offer.status === 'pending') && !(isBuyer && offer.status === 'countered')) {
        return NextResponse.json({ error: 'Not allowed' }, { status: 400 })
      }
      await db.query(`UPDATE listing_offers SET status = 'rejected' WHERE id = ?`, [offerId])

      const senderId = me
      const receiverId = isSeller ? Number(offer.buyer_user_id) : Number(offer.seller_user_id)
      const msg = `Teklif reddedildi.`

      await db.query(
        `INSERT INTO conversation_messages (conversation_id, sender_user_id, receiver_user_id, message)
         VALUES (?, ?, ?, ?)`,
        [offer.conversation_id, senderId, receiverId, msg]
      )
      await db.query(`UPDATE listing_conversations SET last_message_at = NOW() WHERE id = ?`, [offer.conversation_id])

      await db.query(
        `INSERT INTO user_notifications (user_id, type, title, message, link)
         VALUES (?, 'offer', 'Teklif güncellendi', ?, ?)`,
        [receiverId, msg.slice(0, 160), `/messages/${offer.conversation_id}`]
      ).catch(() => {})

      return NextResponse.json({ ok: true })
    }

    if (action === 'counter') {
      if (!(isSeller && offer.status === 'pending')) {
        return NextResponse.json({ error: 'Not allowed' }, { status: 400 })
      }
      const counterAmount = Number(body?.counterAmount)
      if (!counterAmount || counterAmount <= 0) {
        return NextResponse.json({ error: 'counterAmount required' }, { status: 400 })
      }
      await db.query(
        `UPDATE listing_offers SET status = 'countered', counter_amount = ? WHERE id = ?`,
        [counterAmount, offerId]
      )

      const senderId = me
      const receiverId = Number(offer.buyer_user_id)
      const msg = `Karşı teklif: ${money(counterAmount)}`

      await db.query(
        `INSERT INTO conversation_messages (conversation_id, sender_user_id, receiver_user_id, message)
         VALUES (?, ?, ?, ?)`,
        [offer.conversation_id, senderId, receiverId, msg]
      )
      await db.query(`UPDATE listing_conversations SET last_message_at = NOW() WHERE id = ?`, [offer.conversation_id])

      await db.query(
        `INSERT INTO user_notifications (user_id, type, title, message, link)
         VALUES (?, 'offer', 'Karşı teklif', ?, ?)`,
        [receiverId, msg.slice(0, 160), `/messages/${offer.conversation_id}`]
      ).catch(() => {})

      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (e) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}
