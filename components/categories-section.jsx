'use client'

import { useRef, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from './language-provider'
import { ArrowRight } from 'lucide-react'

const CATEGORIES_DATA = {
  tr: [
    { id: 'vehicles', label: 'Araç & Vasıta', emoji: '🚗', color: '#ef4444', hoverBg: 'rgba(239,68,68,0.07)', hoverBorder: 'rgba(239,68,68,0.22)', glow: 'rgba(239,68,68,0.15)' },
    { id: 'electronics', label: 'Elektronik', emoji: '💻', color: '#3b82f6', hoverBg: 'rgba(59,130,246,0.07)', hoverBorder: 'rgba(59,130,246,0.22)', glow: 'rgba(59,130,246,0.15)' },
    { id: 'realestate', label: 'Emlak', emoji: '🏠', color: '#22c55e', hoverBg: 'rgba(34,197,94,0.07)', hoverBorder: 'rgba(34,197,94,0.22)', glow: 'rgba(34,197,94,0.15)' },
    { id: 'home', label: 'Ev & Yaşam', emoji: '🛋️', color: '#f59e0b', hoverBg: 'rgba(245,158,11,0.07)', hoverBorder: 'rgba(245,158,11,0.22)', glow: 'rgba(245,158,11,0.15)' },
    { id: 'fashion', label: 'Giyim & Aksesuar', emoji: '👗', color: '#ec4899', hoverBg: 'rgba(236,72,153,0.07)', hoverBorder: 'rgba(236,72,153,0.22)', glow: 'rgba(236,72,153,0.15)' },
    { id: 'sports', label: 'Spor & Outdoor', emoji: '⚽', color: '#6366f1', hoverBg: 'rgba(99,102,241,0.07)', hoverBorder: 'rgba(99,102,241,0.22)', glow: 'rgba(99,102,241,0.15)' },
    { id: 'books', label: 'Kitap & Hobi', emoji: '📚', color: '#8b5cf6', hoverBg: 'rgba(139,92,246,0.07)', hoverBorder: 'rgba(139,92,246,0.22)', glow: 'rgba(139,92,246,0.15)' },
    { id: 'other', label: 'Diğer', emoji: '📦', color: '#f97316', hoverBg: 'rgba(249,115,22,0.07)', hoverBorder: 'rgba(249,115,22,0.22)', glow: 'rgba(249,115,22,0.15)' },
  ],
  en: [
    { id: 'vehicles', label: 'Vehicles', emoji: '🚗', color: '#ef4444', hoverBg: 'rgba(239,68,68,0.07)', hoverBorder: 'rgba(239,68,68,0.22)', glow: 'rgba(239,68,68,0.15)' },
    { id: 'electronics', label: 'Electronics', emoji: '💻', color: '#3b82f6', hoverBg: 'rgba(59,130,246,0.07)', hoverBorder: 'rgba(59,130,246,0.22)', glow: 'rgba(59,130,246,0.15)' },
    { id: 'realestate', label: 'Real Estate', emoji: '🏠', color: '#22c55e', hoverBg: 'rgba(34,197,94,0.07)', hoverBorder: 'rgba(34,197,94,0.22)', glow: 'rgba(34,197,94,0.15)' },
    { id: 'home', label: 'Home & Living', emoji: '🛋️', color: '#f59e0b', hoverBg: 'rgba(245,158,11,0.07)', hoverBorder: 'rgba(245,158,11,0.22)', glow: 'rgba(245,158,11,0.15)' },
    { id: 'fashion', label: 'Fashion', emoji: '👗', color: '#ec4899', hoverBg: 'rgba(236,72,153,0.07)', hoverBorder: 'rgba(236,72,153,0.22)', glow: 'rgba(236,72,153,0.15)' },
    { id: 'sports', label: 'Sports', emoji: '⚽', color: '#6366f1', hoverBg: 'rgba(99,102,241,0.07)', hoverBorder: 'rgba(99,102,241,0.22)', glow: 'rgba(99,102,241,0.15)' },
    { id: 'books', label: 'Books & Hobby', emoji: '📚', color: '#8b5cf6', hoverBg: 'rgba(139,92,246,0.07)', hoverBorder: 'rgba(139,92,246,0.22)', glow: 'rgba(139,92,246,0.15)' },
    { id: 'other', label: 'Other', emoji: '📦', color: '#f97316', hoverBg: 'rgba(249,115,22,0.07)', hoverBorder: 'rgba(249,115,22,0.22)', glow: 'rgba(249,115,22,0.15)' },
  ],
}

function CategoryCard({ cat, index }) {
  const router = useRouter()
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.08 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <button
      ref={ref}
      onClick={() => router.push('/listings?category=' + cat.id)}
      className="relative flex flex-col items-center gap-3 py-7 px-4 rounded-2xl text-center"
      style={{
        background: hovered ? cat.hoverBg : 'var(--card)',
        border: '1.5px solid ' + (hovered ? cat.hoverBorder : 'var(--border)'),
        boxShadow: hovered ? ('0 10px 32px ' + cat.glow) : 'none',
        opacity: visible ? 1 : 0,
        transform: visible
          ? (hovered ? 'translateY(-6px) scale(1.03)' : 'translateY(0) scale(1)')
          : 'translateY(22px) scale(0.95)',
        transition: 'opacity 0.5s ease ' + (index * 50) + 'ms, transform 0.28s ease, box-shadow 0.28s ease, background 0.28s ease, border-color 0.28s ease',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span
        style={{
          fontSize: '2.8rem',
          lineHeight: 1,
          display: 'block',
          transition: 'transform 0.3s ease',
          transform: hovered ? 'scale(1.22) rotate(-7deg)' : 'scale(1) rotate(0deg)',
        }}
      >
        {cat.emoji}
      </span>
      <h3 className="font-semibold text-sm text-foreground">{cat.label}</h3>
      <span
        className="absolute top-3 right-3"
        style={{
          color: cat.color,
          opacity: hovered ? 1 : 0,
          transform: hovered ? 'translateX(0)' : 'translateX(-5px)',
          transition: 'opacity 0.22s ease, transform 0.22s ease',
        }}
      >
        <ArrowRight size={14} />
      </span>
    </button>
  )
}

export default function CategoriesSection() {
  const { lang } = useLanguage()
  const router = useRouter()
  const headerRef = useRef(null)
  const [headerVisible, setHeaderVisible] = useState(false)
  const categories = CATEGORIES_DATA[lang] || CATEGORIES_DATA.tr

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHeaderVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )
    if (headerRef.current) observer.observe(headerRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section className="py-20 bg-background relative overflow-hidden">
      {/* Subtle transition into the next (How It Works) section */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent to-muted/30 dark:to-black/60"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          ref={headerRef}
          className="flex items-end justify-between mb-10"
          style={{
            opacity: headerVisible ? 1 : 0,
            transform: headerVisible ? 'translateY(0)' : 'translateY(18px)',
            transition: 'opacity 0.6s ease, transform 0.6s ease',
          }}
        >
          <div>
            <p
              className="text-xs font-extrabold uppercase mb-2"
              style={{ color: 'var(--brand-orange)', letterSpacing: '0.16em' }}
            >
              {lang === 'tr' ? 'KATEGORİLER' : 'CATEGORIES'}
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              {lang === 'tr' ? 'Ne arıyorsun?' : 'What are you looking for?'}
            </h2>
          </div>
          <button
            onClick={() => router.push('/listings')}
            className="hidden sm:flex items-center gap-1.5 text-sm font-semibold transition-all duration-200 hover:gap-3"
            style={{ color: 'var(--brand-orange)' }}
          >
            {lang === 'tr' ? 'Tümünü Gör' : 'See All'}
            <ArrowRight size={15} />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {categories.map((cat, i) => (
            <CategoryCard key={cat.id} cat={cat} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
