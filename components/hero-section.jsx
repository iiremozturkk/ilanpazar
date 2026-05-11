'use client'

import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import { Shield, Clock, Star, TrendingUp } from 'lucide-react'
import { useLanguage } from './language-provider'

const STATS = {
  tr: [
    { value: 2400000, label: 'Aktif İlan', suffix: '+' },
    { value: 850000, label: 'Kayıtlı Kullanıcı', suffix: '+' },
    { value: 98, label: 'Müşteri Memnuniyeti', suffix: '%' },
  ],
  en: [
    { value: 2400000, label: 'Active Listings', suffix: '+' },
    { value: 850000, label: 'Registered Users', suffix: '+' },
    { value: 98, label: 'Satisfaction Rate', suffix: '%' },
  ],
}

const TRUST_ITEMS = {
  tr: [
    { icon: Shield, label: 'Güvenli Platform' },
    { icon: Clock, label: '7/24 Destek' },
    { icon: Star, label: 'Doğrulanmış Satıcılar' },
  ],
  en: [
    { icon: Shield, label: 'Secure Platform' },
    { icon: Clock, label: '24/7 Support' },
    { icon: Star, label: 'Verified Sellers' },
  ],
}

const HERO_WORDS = {
  tr: ['Al.', 'Sat.', 'Kazan.'],
  en: ['Buy.', 'Sell.', 'Win.'],
}

const HERO_PRODUCTS = {
  tr: [
    { title: 'Akıllı Telefon', category: 'Teknoloji', src: '/hero-products/phone.svg' },
    { title: 'Laptop', category: 'Teknoloji', src: '/hero-products/laptop.svg' },
    { title: 'Tasarım Koltuk', category: 'Mobilya', src: '/hero-products/sofa.svg' },
    { title: 'Kablosuz Kulaklık', category: 'Teknoloji', src: '/hero-products/headphones.svg' },
    { title: 'Masa Lambası', category: 'Ev Yaşam', src: '/hero-products/lamp.svg' },
    { title: 'Modern Sandalye', category: 'Mobilya', src: '/hero-products/chair.svg' },
  ],
  en: [
    { title: 'Smart Phone', category: 'Tech', src: '/hero-products/phone.svg' },
    { title: 'Laptop', category: 'Tech', src: '/hero-products/laptop.svg' },
    { title: 'Designer Sofa', category: 'Furniture', src: '/hero-products/sofa.svg' },
    { title: 'Wireless Headphones', category: 'Tech', src: '/hero-products/headphones.svg' },
    { title: 'Desk Lamp', category: 'Home', src: '/hero-products/lamp.svg' },
    { title: 'Modern Chair', category: 'Furniture', src: '/hero-products/chair.svg' },
  ],
}

function CountUp({ end, duration = 2000, suffix = '' }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const started = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started.current) return
        started.current = true
        observer.disconnect()

        let startTime = null
        const animate = (timestamp) => {
          if (!startTime) startTime = timestamp
          const progress = Math.min((timestamp - startTime) / duration, 1)
          const eased = 1 - Math.pow(1 - progress, 3)
          setCount(Math.floor(eased * end))
          if (progress < 1) requestAnimationFrame(animate)
          else setCount(end)
        }
        requestAnimationFrame(animate)
      },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [end, duration])

  const display = end >= 1000000
    ? (count / 1000000).toFixed(1) + 'M'
    : end >= 1000
    ? (count / 1000).toFixed(count >= 800000 ? 0 : 1) + (end >= 1000 ? 'K' : '')
    : count.toString()

  const finalDisplay = end >= 1000000
    ? (end / 1000000).toFixed(1) + 'M'
    : end >= 1000
    ? Math.floor(end / 1000) + 'K'
    : end.toString()

  return (
    <span ref={ref}>
      {count === end ? finalDisplay : display}{suffix}
    </span>
  )
}

function Particles() {
  const [particles, setParticles] = useState([])

  useEffect(() => {
    setParticles(
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        size: Math.random() * 3 + 1,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 6,
        duration: Math.random() * 4 + 4,
        opacity: Math.random() * 0.25 + 0.05,
      }))
    )
  }, [])

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full bg-primary"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
            opacity: p.opacity,
            animation: `float-slow ${p.duration}s ease-in-out ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  )
}

function ProductShowcase({ products, lang }) {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % products.length)
    }, 3200)

    return () => clearInterval(interval)
  }, [products.length])

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
      <div className="absolute inset-y-0 right-0 w-full md:w-[56%]">
        {products.map((product, index) => (
          <div
            key={product.title}
            className="absolute inset-0 transition-all duration-1000"
            style={{
              opacity: activeIndex === index ? 0.35 : 0,
              transform: activeIndex === index ? 'scale(1)' : 'scale(1.06)',
            }}
          >
            <div className="absolute inset-y-[8%] right-[-6%] w-[90%] rounded-[40px] overflow-hidden border border-white/10 shadow-2xl backdrop-blur-[2px]">
              <Image src={product.src} alt={product.title} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" priority={index === 0} />
              <div className="absolute inset-0 bg-gradient-to-l from-black/10 via-black/35 to-transparent" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.26),transparent_32%)]" />
            </div>
          </div>
        ))}
      </div>

      <div className="absolute right-4 top-[19%] hidden lg:block w-[220px] rounded-[26px] border border-white/12 bg-black/30 p-3 shadow-2xl backdrop-blur-md transition-all duration-700"
        style={{ transform: `translateY(${activeIndex % 2 === 0 ? '0px' : '-10px'})` }}>
        <div className="relative h-[120px] rounded-[20px] overflow-hidden mb-3">
          <Image src={products[activeIndex].src} alt={products[activeIndex].title} fill sizes="220px" className="object-cover" />
        </div>
        <div className="text-[11px] uppercase tracking-[0.24em] text-white/55">{products[activeIndex].category}</div>
        <div className="mt-1 text-sm font-semibold text-white">{products[activeIndex].title}</div>
      </div>

      <div className="absolute left-2 bottom-[20%] hidden md:block w-[180px] rounded-[24px] border border-white/10 bg-white/8 p-2.5 shadow-xl backdrop-blur-md transition-all duration-700"
        style={{ transform: `translateY(${activeIndex % 2 === 0 ? '10px' : '0px'})` }}>
        <div className="relative h-[96px] rounded-[18px] overflow-hidden mb-2">
          <Image src={products[(activeIndex + 1) % products.length].src} alt={products[(activeIndex + 1) % products.length].title} fill sizes="180px" className="object-cover" />
        </div>
        <div className="text-[10px] uppercase tracking-[0.22em] text-white/50">{products[(activeIndex + 1) % products.length].category}</div>
        <div className="mt-1 text-xs font-semibold text-white/95">{products[(activeIndex + 1) % products.length].title}</div>
      </div>

      <div className="absolute right-[20%] bottom-[14%] hidden xl:block w-[170px] rounded-[22px] border border-white/10 bg-black/25 p-2.5 shadow-xl backdrop-blur-md">
        <div className="relative h-[86px] rounded-[16px] overflow-hidden mb-2">
          <Image src={products[(activeIndex + 2) % products.length].src} alt={products[(activeIndex + 2) % products.length].title} fill sizes="170px" className="object-cover" />
        </div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-white/50">{products[(activeIndex + 2) % products.length].category}</div>
        <div className="mt-1 text-xs font-semibold text-white/95">{products[(activeIndex + 2) % products.length].title}</div>
      </div>

      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[var(--brand-hero-bg)]" />
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--brand-hero-bg)] via-[rgba(14,14,18,0.76)] to-transparent md:from-[rgba(14,14,18,0.88)]" />
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--brand-hero-bg)]/95 via-transparent to-transparent" />

    </div>
  )
}

export default function HeroSection() {
  const { lang } = useLanguage()
  const trustItems = TRUST_ITEMS[lang] || TRUST_ITEMS.tr
  const stats = STATS[lang] || STATS.tr
  const words = HERO_WORDS[lang] || HERO_WORDS.tr
  const products = HERO_PRODUCTS[lang] || HERO_PRODUCTS.tr
  const [visible, setVisible] = useState(false)
  const [activeWord, setActiveWord] = useState(2)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    setActiveWord(2)

    const interval = setInterval(() => {
      setActiveWord((prev) => (prev + 1) % words.length)
    }, 1800)

    return () => clearInterval(interval)
  }, [lang, words.length])

  return (
    <section className="relative min-h-[84vh] flex flex-col overflow-hidden bg-[var(--brand-hero-bg)]">
      <ProductShowcase products={products} lang={lang} />

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-32 -right-32 w-[700px] h-[700px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.12) 0%, transparent 65%)' }}
        />
        <div
          className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.07) 0%, transparent 65%)' }}
        />
      </div>

      <Particles />

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 pt-12 md:pt-14 pb-8 md:pb-10">
        <div
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(14px)',
            transition: 'opacity 0.6s ease, transform 0.6s ease',
            transitionDelay: '0ms',
            marginBottom: '0.45rem',
          }}
        >
          <div className="animate-sway flex items-center gap-2 px-5 py-2.5 rounded-full border border-primary/35 bg-primary/10 text-primary text-sm font-semibold backdrop-blur-sm">
            <TrendingUp size={13} />
            {lang === 'tr'
              ? "Türkiye'nin En Hızlı Büyüyen İlan Platformu"
              : "Turkey's Fastest Growing Listing Platform"}
          </div>
        </div>

        <div
          className="mb-4 text-center"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(22px)',
            transition: 'opacity 0.7s ease, transform 0.7s ease',
            transitionDelay: '100ms',
          }}
        >
          <div className="relative inline-block">
            <span
              aria-hidden
              className="absolute left-0 top-1/2 hidden -translate-x-[calc(100%+16px)] -translate-y-1/2 items-center gap-1.5 lg:flex"
            >
              <span className="h-px w-12 bg-primary/40" />
              <span className="h-1.5 w-1.5 rounded-full bg-primary/60" />
            </span>
            <span
              aria-hidden
              className="absolute right-0 top-1/2 hidden translate-x-[calc(100%+16px)] -translate-y-1/2 items-center gap-1.5 lg:flex"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-primary/60" />
              <span className="h-px w-12 bg-primary/40" />
            </span>

            <h1
              className="text-center font-black leading-[0.86] tracking-tighter text-balance"
              style={{ fontSize: 'clamp(72px, 12.8vw, 154px)' }}
            >
              {words.map((word, i) => (
                <span
                  key={word}
                  className="relative block transition-all duration-500"
                  style={{
                    color:
                      i === 1
                        ? 'var(--brand-orange)'
                        : activeWord === i
                          ? 'hsl(var(--foreground))'
                          : 'rgba(110,110,118,0.72)',
                    textShadow:
                      i === 1 && activeWord === i
                        ? '0 0 60px rgba(249,115,22,0.50), 0 0 120px rgba(249,115,22,0.28)'
                        : activeWord === i && i !== 1
                          ? '0 0 48px rgba(255,255,255,0.18), 0 0 96px rgba(255,255,255,0.10)'
                          : 'none',
                    transform: activeWord === i ? 'scale(1.03)' : 'scale(1)',
                  }}
                >
                  {word}
                </span>
              ))}
            </h1>
          </div>

          <div className="mx-auto mt-3.5 flex h-1.5 w-full max-w-[24rem] items-center justify-center gap-2">
            {words.map((_, i) => (
              <div
                key={i}
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: activeWord === i ? '44%' : i === 1 ? '24%' : '22%',
                  background:
                    i === 1
                      ? 'var(--brand-orange)'
                      : activeWord === i
                        ? 'rgba(255,255,255,0.88)'
                        : 'rgba(68,68,72,0.78)',
                }}
              />
            ))}
          </div>

          <p className="mx-auto mt-5 max-w-4xl text-balance text-center text-[clamp(0.9rem,1.2vw,1.18rem)] leading-[1.38] text-muted-foreground">
            {lang === 'tr'
              ? <>Milyonlarca ilan arasından istediğini bul ya da <span className="font-semibold text-foreground">ücretsiz ilanını ver</span>, saniyeler içinde.</>
              : <>Find what you need among millions of listings or <span className="font-semibold text-foreground">post yours for free</span>, in seconds.</>}
          </p>
        </div>

        <div
          className="mt-8 sm:mt-10 flex items-center justify-center gap-8 sm:gap-12 flex-wrap"
          style={{
            opacity: visible ? 1 : 0,
            transition: 'opacity 0.7s ease',
            transitionDelay: '360ms',
          }}
        >
          {stats.map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-foreground dark:text-white mb-0.5">
                <CountUp end={stat.value} suffix={stat.suffix} duration={2200} />
              </div>
              <div className="text-xs text-muted-foreground dark:text-white/40 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10 border-t border-border/60 bg-[linear-gradient(180deg,rgba(10,10,12,0.72),rgba(10,10,12,0.9))] py-4 dark:border-white/10">
        <div className="mx-auto flex max-w-5xl flex-wrap items-stretch justify-center gap-3 px-4 sm:gap-4">
          {trustItems.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="group min-w-[200px] flex-1 rounded-2xl border px-4 py-3 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5"
              style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
                borderColor: 'rgba(255,255,255,0.08)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.04)',
              }}
            >
              <div className="flex items-center justify-center gap-3 text-center">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full"
                  style={{
                    background: 'rgba(249,115,22,0.14)',
                    border: '1px solid rgba(249,115,22,0.24)',
                  }}
                >
                  <Icon size={16} style={{ color: 'var(--brand-orange)' }} strokeWidth={1.8} />
                </div>
                <div className="text-sm font-semibold text-white/90">{label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
