'use client'

import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, Truck, Zap } from 'lucide-react'
import { useLanguage } from './language-provider'

const STEPS = {
  tr: [
    {
      icon: CheckCircle2,
      num: '1',
      title: 'Kayıt Ol',
      desc: 'Saniyeler içinde hesabını oluştur, profilini tamamla ve hemen başla.',
    },
    {
      icon: Zap,
      num: '2',
      title: 'İlanını Yayınla',
      desc: 'Fotoğraf ekle, fiyat belirle ve ilanını dakikalar içinde yayına al.',
    },
    {
      icon: Truck,
      num: '3',
      title: 'Satışını Tamamla',
      desc: 'Alıcıyla buluşarak veya kargo ile teslim ederek satışını güvenle tamamla.',
    },
  ],
  en: [
    {
      icon: CheckCircle2,
      num: '1',
      title: 'Sign Up',
      desc: 'Create your account in seconds, complete your profile, and get started.',
    },
    {
      icon: Zap,
      num: '2',
      title: 'Publish Your Listing',
      desc: 'Add photos, set a price, and publish your listing in minutes.',
    },
    {
      icon: Truck,
      num: '3',
      title: 'Complete the Sale',
      desc: 'Meet the buyer or ship with cargo and complete your sale safely.',
    },
  ],
}

function FlowStep({ step, index }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  const Icon = step.icon

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.2 }
    )

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className="relative flex flex-col gap-5 lg:min-h-[180px]"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.6s ease, transform 0.6s ease',
        transitionDelay: `${index * 120}ms`,
      }}
    >
      <div className="flex items-center gap-4">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-extrabold text-white"
          style={{
            background: 'linear-gradient(135deg, rgba(249,115,22,1) 0%, rgba(251,146,60,1) 100%)',
            boxShadow: '0 10px 30px rgba(249,115,22,0.28)',
          }}
        >
          {step.num}
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-black/5 bg-background/80 shadow-[0_10px_25px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none">
          <Icon size={22} className="text-foreground dark:text-white" strokeWidth={1.9} />
        </div>
      </div>

      <div>
        <h3 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-[2rem]">
          {step.title}
        </h3>
        <p className="mt-3 max-w-[280px] text-base leading-7 text-muted-foreground dark:text-white/68">
          {step.desc}
        </p>
      </div>
    </div>
  )
}

export default function HowItWorks() {
  const { lang } = useLanguage()
  const headerRef = useRef(null)
  const [headerVisible, setHeaderVisible] = useState(false)
  const steps = STEPS[lang] || STEPS.tr

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHeaderVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15 }
    )

    if (headerRef.current) observer.observe(headerRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section className="relative overflow-hidden bg-muted/30 py-28 dark:bg-background">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(249,115,22,0.45) 1px, transparent 1px)',
          backgroundSize: '38px 38px',
          opacity: 0.028,
        }}
      />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-background to-transparent dark:from-black/60"
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div
          ref={headerRef}
          className="text-center"
          style={{
            opacity: headerVisible ? 1 : 0,
            transform: headerVisible ? 'translateY(0)' : 'translateY(18px)',
            transition: 'opacity 0.65s ease, transform 0.65s ease',
          }}
        >
          <p className="mb-5 text-sm font-extrabold uppercase sm:text-base" style={{ color: 'var(--brand-orange)', letterSpacing: '0.22em' }}>
            {lang === 'tr' ? 'NASIL ÇALIŞIR?' : 'HOW IT WORKS?'}
          </p>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-7 text-muted-foreground dark:text-white/65 sm:text-base">
            {lang === 'tr'
              ? 'Hesabını oluştur, ilanını yayınla ve ürünü elden ya da kargo ile güvenle teslim et.'
              : 'Create your account, publish your listing, and complete delivery in person or via cargo safely.'}
          </p>
        </div>

        <div className="relative mt-16">
          <div
            aria-hidden
            className="pointer-events-none absolute left-0 right-0 top-[22px] hidden h-px lg:block"
            style={{
              background: 'linear-gradient(90deg, rgba(249,115,22,0) 0%, rgba(249,115,22,0.48) 12%, rgba(249,115,22,0.48) 88%, rgba(249,115,22,0) 100%)',
            }}
          />

          <div className="grid grid-cols-1 gap-10 lg:grid-cols-3 lg:items-start lg:gap-12">
            <FlowStep step={steps[0]} index={0} />
            <FlowStep step={steps[1]} index={1} />

            <FlowStep step={steps[2]} index={2} />
          </div>
        </div>
      </div>
    </section>
  )
}
