'use client'

import { useLanguage } from './language-provider'

const ITEMS_TR = [
  'KEŞFET',
  'İLAN VER',
  'AL SAT',
  'GÜVENLE SAT',
  'ÜCRETSİZ',
  'HIZLI',
  'GÜVENLİ',
  'KOLAY',
]

const ITEMS_EN = [
  'EXPLORE',
  'POST AD',
  'BUY SELL',
  'SELL SAFELY',
  'FREE',
  'FAST',
  'SECURE',
  'EASY',
]

export default function MarqueeTicker() {
  const { lang } = useLanguage()
  const items = lang === 'tr' ? ITEMS_TR : ITEMS_EN

  // Duplicate items so the seamless loop works (3× for extra safety)
  const repeated = [...items, ...items, ...items]

  return (
    <div
      className="relative overflow-hidden py-7 select-none"
      style={{
        background: 'var(--background)',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {/* Left fade mask */}
      <div
        className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
        style={{
          background: 'linear-gradient(to right, var(--background), transparent)',
        }}
      />
      {/* Right fade mask */}
      <div
        className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
        style={{
          background: 'linear-gradient(to left, var(--background), transparent)',
        }}
      />

      <div
        className="flex whitespace-nowrap"
        style={{
          animation: 'ticker-left 28s linear infinite',
          width: 'max-content',
        }}
      >
        {repeated.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-3">
            {/* Dot separator */}
            <span
              className="inline-block w-2.5 h-2.5 rounded-full shrink-0 mx-1"
              style={{ background: 'var(--brand-orange)', opacity: 0.75 }}
            />
            {/* Word */}
            <span
              className="font-extrabold uppercase tracking-tight"
              style={{
                fontSize: 'clamp(1.6rem, 3.5vw, 2.6rem)',
                color: 'var(--muted-foreground)',
                letterSpacing: '-0.01em',
              }}
            >
              {item}
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}
