'use client'

import { useEffect, useRef, useState } from 'react'
import { MessageSquare, X, Send, Sparkles } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'

export default function AIChatAssistant() {
  const { lang } = useLanguage()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState(() => [
    {
      role: 'assistant',
      content:
        lang === 'tr'
          ? 'Merhaba! İlan vermek, arama/filtreleme veya güvenli alışveriş ile ilgili sorunu yazabilirsin.'
          : 'Hi! Ask me about posting a listing, search/filter, or safe trading tips.',
    },
  ])

  const listRef = useRef(null)

  useEffect(() => {
    // Update the first welcome message when language changes
    setMessages((prev) => {
      if (!prev.length) return prev
      const first = prev[0]
      if (first.role !== 'assistant') return prev
      const next = [...prev]
      next[0] = {
        role: 'assistant',
        content:
          lang === 'tr'
            ? 'Merhaba! İlan vermek, arama/filtreleme veya güvenli alışveriş ile ilgili sorunu yazabilirsin.'
            : 'Hi! Ask me about posting a listing, search/filter, or safe trading tips.',
      }
      return next
    })
  }, [lang])

  useEffect(() => {
    if (!open) return
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [open, messages, loading])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return

    setInput('')
    const next = [...messages, { role: 'user', content: text }]
    setMessages(next)
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next, lang }),
      })
      const data = await res.json()
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply || (lang === 'tr' ? 'Bir hata oluştu.' : 'Something went wrong.') }])
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: lang === 'tr' ? 'Bağlantı hatası.' : 'Connection error.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-[60]">
      {/* Toggle button */}
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="group flex items-center gap-2 rounded-full px-4 py-3 bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:opacity-95 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          aria-label={lang === 'tr' ? 'AI Chat Assistant Aç' : 'Open AI Chat Assistant'}
        >
          <MessageSquare size={18} />
          <span className="text-sm font-semibold">
            {lang === 'tr' ? 'AI Chat' : 'AI Chat'}
          </span>
          <Sparkles size={16} className="opacity-90 group-hover:opacity-100" />
        </button>
      ) : (
        <div className="w-[320px] sm:w-[360px] rounded-2xl border border-border bg-card shadow-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-[var(--brand-surface)]">
            <div>
              <div className="text-sm font-bold text-foreground">AI Chat Assistant</div>
              <div className="text-xs text-muted-foreground">
                {lang === 'tr' ? 'Soru sor, hızlı cevap al.' : 'Ask a question, get quick help.'}
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              aria-label={lang === 'tr' ? 'Kapat' : 'Close'}
            >
              <X size={16} />
            </button>
          </div>

          <div ref={listRef} className="max-h-[360px] overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={
                  m.role === 'user'
                    ? 'flex justify-end'
                    : 'flex justify-start'
                }
              >
                <div
                  className={
                    m.role === 'user'
                      ? 'max-w-[85%] rounded-2xl rounded-br-md bg-primary text-primary-foreground px-3.5 py-2 text-sm'
                      : 'max-w-[85%] rounded-2xl rounded-bl-md bg-muted text-foreground px-3.5 py-2 text-sm'
                  }
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="text-xs text-muted-foreground">{lang === 'tr' ? 'Yazıyor…' : 'Typing…'}</div>
            )}
          </div>

          <div className="border-t border-border p-3">
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    send()
                  }
                }}
                placeholder={lang === 'tr' ? 'Mesaj yaz…' : 'Type a message…'}
                className="flex-1 h-10 px-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
              />
              <button
                onClick={send}
                disabled={loading || !input.trim()}
                className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 disabled:opacity-50 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                aria-label={lang === 'tr' ? 'Gönder' : 'Send'}
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
