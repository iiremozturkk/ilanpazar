'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/navbar'
import Footer from '@/components/footer'
import { useAuth } from '@/hooks/use-auth'
import { useLanguage } from '@/components/language-provider'
import { Badge } from '@/components/ui/badge'

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

export default function MessagesPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const { lang } = useLanguage()
  const [items, setItems] = useState([])
  const [busy, setBusy] = useState(true)

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [loading, user, router])

  useEffect(() => {
    if (!user) return
    setBusy(true)
    fetch('/api/conversations')
      .then(r => r.json())
      .then(d => setItems(d.conversations || []))
      .catch(() => setItems([]))
      .finally(() => setBusy(false))
  }, [user])

  const title = lang === 'tr' ? 'Mesajlar' : 'Messages'
  const emptyText = lang === 'tr' ? 'Henüz mesaj yok.' : 'No messages yet.'

  const list = useMemo(() => items || [], [items])

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 pt-10 pb-16">
        <div className="flex items-end justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{title}</h1>
            <p className="text-sm text-muted-foreground">
              {lang === 'tr' ? 'İlan üzerinden satıcıyla sohbet ve tekliflerin burada.' : 'Chats and offers from listings show up here.'}
            </p>
          </div>
        </div>

        {busy ? (
          <div className="text-sm text-muted-foreground">{lang === 'tr' ? 'Yükleniyor…' : 'Loading…'}</div>
        ) : list.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
            {emptyText}
          </div>
        ) : (
          <div className="space-y-3">
            {list.map(c => {
              const meIsBuyer = Number(c.buyer_user_id) === Number(user?.id)
              const otherName = meIsBuyer ? c.seller_name : c.buyer_name
              const rt = formatResponseTime(c.response_time_seconds, lang)
              return (
                <Link
                  key={c.id}
                  href={`/messages/${c.id}`}
                  className="block rounded-2xl border border-border bg-card p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                      {(otherName || 'U')[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate">{otherName}</p>
                          <p className="text-xs text-muted-foreground truncate">{c.listing_title}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {rt && (
                            <Badge variant="secondary">
                              {lang === 'tr' ? 'Yanıt' : 'Reply'}: {rt}
                            </Badge>
                          )}
                          {Number(c.unread_count || 0) > 0 && (
                            <Badge>
                              {c.unread_count}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {c.last_message || (lang === 'tr' ? 'Sohbet başlatıldı.' : 'Conversation started.')}
                      </p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
