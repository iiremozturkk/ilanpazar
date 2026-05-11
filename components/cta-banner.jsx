'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'
import { useLanguage } from './language-provider'

export default function CtaBanner() {
  const { lang } = useLanguage()
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect() } },
      { threshold: 0.2 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={ref}
      className="py-24 bg-background relative overflow-hidden"
      style={{
        backgroundImage: 'linear-gradient(to bottom, color-mix(in oklab, var(--background) 0%, transparent) 0%, color-mix(in oklab, var(--brand-orange) 8%, var(--background)) 16%, var(--background) 42%, var(--background) 100%), radial-gradient(circle at top center, color-mix(in oklab, var(--brand-orange) 10%, transparent), transparent 58%)',
      }}
    >
      <div
        className="absolute inset-x-0 top-0 h-28 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, color-mix(in oklab, var(--brand-orange) 10%, var(--background)) 0%, color-mix(in oklab, var(--brand-orange) 4%, var(--background)) 45%, transparent 100%)',
        }}
      />

      {/* Animated dot grid background */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, var(--brand-orange) 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
        }}
      />

      <div
        className="relative max-w-3xl mx-auto px-4 text-center"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(30px)',
          transition: 'opacity 0.7s ease, transform 0.7s ease',
        }}
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/25 text-primary text-sm font-semibold mb-6">
          <Sparkles size={14} />
          {lang === 'tr' ? 'Ücretsiz — Hızlı — Güvenli' : 'Free — Fast — Secure'}
        </div>

        <h2 className="text-4xl sm:text-5xl font-extrabold text-foreground mb-4 tracking-tight text-balance">
          {lang === 'tr'
            ? <>Satmak istediğin bir şey mi var?</>
            : <>Have something you want to sell?</>}
        </h2>
        <p className="text-muted-foreground text-lg mb-10 text-balance leading-relaxed">
          {lang === 'tr'
            ? 'Dakikalar içinde ilanını ver ve milyonlarca alıcıya ulaş. Kayıt ücretsiz.'
            : 'Post your listing in minutes and reach millions of buyers. Registration is free.'}
        </p>

        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            href="/register"
            className="inline-flex items-center gap-2.5 px-8 py-4 bg-primary text-white font-bold rounded-2xl text-base hover:scale-105 active:scale-95 transition-all duration-200 shadow-xl shadow-primary/30 orange-glow"
          >
            {lang === 'tr' ? 'Hemen Başla' : 'Get Started'}
            <ArrowRight size={18} />
          </Link>
          <Link
            href="/listings"
            className="inline-flex items-center gap-2 px-8 py-4 border border-border text-foreground font-semibold rounded-2xl text-base hover:bg-muted hover:scale-105 active:scale-95 transition-all duration-200"
          >
            {lang === 'tr' ? 'İlanları Gez' : 'Browse Listings'}
          </Link>
        </div>
      </div>
    </section>
  )
}
