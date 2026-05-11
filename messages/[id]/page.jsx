'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import Navbar from '@/components/navbar'
import Footer from '@/components/footer'
import { useAuth } from '@/hooks/use-auth'
import { useLanguage } from '@/components/language-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Check, CheckCheck } from 'lucide-react'

function formatWhen(dt, lang) {
  try {
    const d = new Date(dt)
    return d.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })
  } catch {
    return ''
  }
}

function formatResponseTime(sec, lang) {
  if (!sec || sec <= 0) return null
  const s = Math.round(sec)
  const m = Math.round(s / 60)
  const h = Math.round(s / 3600)
  if (m < 60) return lang === 'tr' ? `~${m} dk` : `~${m} min`
  if (h < 48) return lang === 'tr' ? `~${h} sa` : `~${h} hr`
  const d = Math.round(h / 24)
  return lang === 'tr' ? `~${d} gün` : `~${d} d`
}


function offerStatusLabel(status, lang) {
  const t = (tr, en) => (lang === 'tr' ? tr : en)
  if (status === 'pending') return t('Bekliyor', 'Pending')
  if (status === 'accepted') return t('Kabul edildi', 'Accepted')
  if (status === 'rejected') return t('Reddedildi', 'Rejected')
  if (status === 'countered') return t('Karşı teklif', 'Countered')
  return status || '—'
}

function fmtMoney(n, lang) {
  const x = Number(n)
  if (!Number.isFinite(x)) return '—'
  return x.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US') + ' ₺'
}

export default function ConversationPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user, loading } = useAuth()
  const { lang } = useLanguage()

  const [conversation, setConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [offers, setOffers] = useState([])
  const [counterAmount, setCounterAmount] = useState('')
  const [offerBusy, setOfferBusy] = useState(false)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(true)
  const [sending, setSending] = useState(false)
  const [replyTime, setReplyTime] = useState(null)
  const endRef = useRef(null)

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [loading, user, router])

  // Keep as string (avoid JS number precision issues for BIGINT ids)
  const convId = String(id || '')

  const load = async () => {
    if (!user || !/^\d+$/.test(convId)) return
    setBusy(true)
    try {
      const res = await fetch(`/api/conversations/${convId}/messages`)
      const raw = await res.text()
      const data = (() => {
        try { return JSON.parse(raw) } catch { return { error: raw } }
      })()
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`)
      setConversation(data.conversation)
      setMessages(data.messages || [])
      setOffers(data.offers || [])
      setReplyTime(data.response_time_seconds || null)
      // Mark read
      fetch(`/api/conversations/${convId}/read`, { method: 'POST' }).catch(() => {})
    } catch (e) {
      // Show the real error to make debugging possible.
      toast.error((lang === 'tr' ? 'Sohbet yüklenemedi: ' : 'Could not load conversation: ') + (e?.message || 'error'))
    } finally {
      setBusy(false)
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }
  }

  useEffect(() => {
    load()
    // simple polling for new messages
    const t = setInterval(() => load(), 7000)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, convId])

  const otherName = useMemo(() => {
    if (!conversation || !user) return ''
    const meIsBuyer = Number(conversation.buyer_user_id) === Number(user.id)
    return meIsBuyer ? conversation.seller_name : conversation.buyer_name
  }, [conversation, user])

  const listingTitle = conversation?.listing_title || ''
  const listingId = conversation?.listing_id
  const rt = formatResponseTime(replyTime, lang)

const latestOffer = useMemo(() => (offers && offers.length ? offers[0] : null), [offers])

async function actOnOffer(action) {
  if (!latestOffer) return
  setOfferBusy(true)
  try {
    const body = action === 'counter'
      ? { action, counterAmount: Number(String(counterAmount).replace(',', '.')) }
      : { action }
    const res = await fetch(`/api/offers/${latestOffer.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || 'error')
    setCounterAmount('')
    await load()
  } catch (e) {
    toast.error(lang === 'tr' ? 'Teklif güncellenemedi' : 'Could not update offer')
  } finally {
    setOfferBusy(false)
  }
}

  const send = async () => {
    const msg = text.trim()
    if (!msg) return
    setSending(true)
    try {
      const res = await fetch(`/api/conversations/${convId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'error')
      setText('')
      await load()
      endRef.current?.scrollIntoView({ behavior: 'smooth' })
    } catch {
      toast.error(lang === 'tr' ? 'Mesaj gönderilemedi' : 'Could not send message')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 pt-8 pb-12">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-foreground truncate">{busy ? (lang === 'tr' ? 'Yükleniyor…' : 'Loading…') : otherName}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              {listingId ? (
                <Link href={`/listings/${listingId}`} className="text-sm text-muted-foreground hover:text-primary transition-colors line-clamp-1">
                  {listingTitle}
                </Link>
              ) : (
                <span className="text-sm text-muted-foreground">{listingTitle}</span>
              )}
              {rt && (
                <Badge variant="secondary">{lang === 'tr' ? 'Yanıt süresi' : 'Reply time'}: {rt}</Badge>
              )}
            </div>
          </div>
          <Button variant="outline" onClick={() => router.push('/messages')}>
            {lang === 'tr' ? 'Geri' : 'Back'}
          </Button>
        </div>

        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          {latestOffer && (
            <div className="border-b border-border p-4 bg-muted/20">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary">{lang === 'tr' ? 'Teklif' : 'Offer'}</Badge>
                    <span className="text-sm font-semibold text-foreground">{fmtMoney(latestOffer.amount, lang)}</span>
                    {latestOffer.status === 'countered' && latestOffer.counter_amount != null && (
                      <span className="text-sm text-muted-foreground">→ {fmtMoney(latestOffer.counter_amount, lang)}</span>
                    )}
                    <Badge variant="outline" className="capitalize">{offerStatusLabel(latestOffer.status, lang)}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {lang === 'tr'
                      ? 'Teklifleri buradan yönetebilir ve sohbet edebilirsiniz.'
                      : 'Manage offers here and continue chatting.'}
                  </div>
                </div>

                <div className="shrink-0 flex flex-col items-end gap-2">
                  {/* Seller actions */}
                  {Number(user?.id) === Number(conversation?.seller_user_id) && latestOffer.status === 'pending' && (
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <Button size="sm" disabled={offerBusy} onClick={() => actOnOffer('accept')}>
                        {lang === 'tr' ? 'Kabul et' : 'Accept'}
                      </Button>
                      <Button size="sm" variant="destructive" disabled={offerBusy} onClick={() => actOnOffer('reject')}>
                        {lang === 'tr' ? 'Reddet' : 'Reject'}
                      </Button>
                    </div>
                  )}

                  {Number(user?.id) === Number(conversation?.seller_user_id) && latestOffer.status === 'pending' && (
                    <div className="flex items-center gap-2">
                      <Input
                        value={counterAmount}
                        onChange={e => setCounterAmount(e.target.value)}
                        placeholder={lang === 'tr' ? 'Karşı teklif (₺)' : 'Counter offer (₺)'}
                        className="h-9 w-40"
                        type="number"
                        min="1"
                        step="1"
                        disabled={offerBusy}
                      />
                      <Button size="sm" variant="secondary" disabled={offerBusy || !String(counterAmount).trim()} onClick={() => actOnOffer('counter')}>
                        {lang === 'tr' ? 'Gönder' : 'Send'}
                      </Button>
                    </div>
                  )}

                  {/* Buyer actions for counter */}
                  {Number(user?.id) === Number(conversation?.buyer_user_id) && latestOffer.status === 'countered' && (
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <Button size="sm" disabled={offerBusy} onClick={() => actOnOffer('accept')}>
                        {lang === 'tr' ? 'Kabul et' : 'Accept'}
                      </Button>
                      <Button size="sm" variant="destructive" disabled={offerBusy} onClick={() => actOnOffer('reject')}>
                        {lang === 'tr' ? 'Reddet' : 'Reject'}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="h-[58vh] overflow-y-auto p-4 space-y-3">
            {messages.map(m => {
              const isMe = Number(m.sender_user_id) === Number(user?.id)
              const isRead = !!m.read_at
              return (
                <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[78%] rounded-2xl px-3 py-2 ${isMe ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
                    <div className="whitespace-pre-wrap text-sm">{m.message}</div>
                    <div className={`mt-1 flex items-center gap-2 text-[11px] ${isMe ? 'text-primary-foreground/80 justify-end' : 'text-muted-foreground'}`}>
                      <span>{formatWhen(m.created_at, lang)}</span>
                      {isMe && (
                        <span className="inline-flex items-center gap-1">
                          {isRead ? <CheckCheck size={14} /> : <Check size={14} />}
                          <span>
                            {isRead
                              ? (lang === 'tr' ? 'Okundu' : 'Read')
                              : (lang === 'tr' ? 'Gönderildi' : 'Sent')}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={endRef} />
          </div>

          <div className="p-3 border-t border-border flex items-center gap-2">
            <Input
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={lang === 'tr' ? 'Mesaj yaz…' : 'Type a message…'}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  send()
                }
              }}
            />
            <Button onClick={send} disabled={sending || !text.trim()}>
              {lang === 'tr' ? 'Gönder' : 'Send'}
            </Button>
          </div>
        </div>

        <div className="mt-4 text-xs text-muted-foreground">
          {lang === 'tr'
            ? 'İpucu: Teklif vermek için ilan sayfasından “Teklif ver”i kullanabilirsin.'
            : 'Tip: Use “Make offer” on the listing page to send an offer.'}
        </div>
      </main>
      <Footer />
    </div>
  )
}
