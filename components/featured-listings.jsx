'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Star } from 'lucide-react'
import { useLanguage } from './language-provider'
import ListingCard from './listing-card'

const FILTERS = [
  { key: 'all', tr: 'Tüm İlanlar', en: 'All Listings' },
  { key: 'electronics', tr: 'Elektronik', en: 'Electronics' },
  { key: 'vehicles', tr: 'Araç', en: 'Vehicles' },
  { key: 'realestate', tr: 'Emlak', en: 'Real Estate' },
  { key: 'fashion', tr: 'Giyim', en: 'Fashion' },
  { key: 'home', tr: 'Ev & Yaşam', en: 'Home & Living' },
]

function formatActiveCount(total, lang) {
  const value = Number(total || 0)
  if (value >= 1000000) {
    const compact = (value / 1000000).toFixed(1).replace(/\.0$/, '')
    return `${compact}M+ ${lang === 'tr' ? 'aktif ilan' : 'active listings'}`
  }
  if (value >= 1000) {
    const compact = (value / 1000).toFixed(1).replace(/\.0$/, '')
    return `${compact}K+ ${lang === 'tr' ? 'aktif ilan' : 'active listings'}`
  }
  return `${value} ${lang === 'tr' ? 'aktif ilan' : 'active listings'}`
}

export default function FeaturedListings() {
  const { t, lang } = useLanguage()
  const [listings, setListings] = useState([])
  const [pagination, setPagination] = useState({ total: 0 })
  const [loading, setLoading] = useState(true)
  const [unconfigured, setUnconfigured] = useState(false)
  const [activeFilter, setActiveFilter] = useState('all')

  useEffect(() => {
    let cancelled = false

    fetch('/api/listings?sort=newest&page=1')
      .then(r => r.json())
      .then(data => {
        if (cancelled) return
        if (data._unconfigured) setUnconfigured(true)
        setListings(Array.isArray(data.listings) ? data.listings : [])
        setPagination(data.pagination || { total: 0 })
      })
      .catch(() => {
        if (!cancelled) setListings([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const filteredListings = useMemo(() => {
    if (activeFilter === 'all') return listings.slice(0, 8)
    return listings.filter(listing => listing.category === activeFilter).slice(0, 8)
  }, [activeFilter, listings])

  const activeTotalText = formatActiveCount(pagination?.total, lang)

  return (
    <section className="relative overflow-hidden bg-[linear-gradient(180deg,#fff7f0_0%,#fff3e8_18%,#fff8f2_58%,var(--background)_100%)] py-14 sm:py-16 dark:bg-[linear-gradient(180deg,#171717_0%,#202020_22%,#151515_58%,var(--background)_100%)]">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent via-[color:rgba(255,255,255,0.42)] to-[var(--background)] dark:via-[rgba(255,255,255,0.04)] dark:to-[var(--background)]" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-7 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl dark:text-white">
              <span className="text-foreground dark:text-white">{lang === 'tr' ? 'Öne Çıkan ' : 'Featured '}</span>
              <span className="text-primary">{lang === 'tr' ? 'İlanlar' : 'Listings'}</span>
            </h2>
          </div>

          <div className="flex items-center gap-2 self-start rounded-full border border-black/10 bg-white/80 px-3 py-2 text-sm text-foreground/70 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-white/70">
            <Star size={14} className="text-primary" />
            <span>{activeTotalText}</span>
          </div>
        </div>

        <div className="mb-7 flex flex-wrap gap-3 sm:mb-8">
          {FILTERS.map(filter => {
            const isActive = activeFilter === filter.key
            return (
              <button
                key={filter.key}
                type="button"
                onClick={() => setActiveFilter(filter.key)}
                className={[
                  'rounded-full px-4 py-3 text-sm font-semibold transition-all duration-200',
                  isActive
                    ? 'bg-primary text-black shadow-[0_8px_30px_rgba(255,106,0,0.28)]'
                    : 'border border-black/10 bg-white/85 text-foreground/70 shadow-sm hover:bg-white hover:text-foreground dark:border-transparent dark:bg-[#0b0f16] dark:text-white/65 dark:hover:bg-[#121823] dark:hover:text-white',
                ].join(' ')}
              >
                {lang === 'tr' ? filter.tr : filter.en}
              </button>
            )
          })}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-[24px] border border-black/10 bg-white dark:border-white/10 dark:bg-[#080b11]">
                <div className="aspect-[4/3] animate-pulse bg-black/5 dark:bg-white/5" />
                <div className="space-y-3 p-5">
                  <div className="h-5 w-4/5 rounded-full bg-black/5 dark:bg-white/5" />
                  <div className="h-7 w-2/5 rounded-full bg-black/5 dark:bg-white/5" />
                  <div className="h-4 w-3/5 rounded-full bg-black/5 dark:bg-white/5" />
                </div>
              </div>
            ))}
          </div>
        ) : unconfigured ? (
          <div className="rounded-[24px] border border-dashed border-black/10 bg-white px-6 py-16 text-center dark:border-white/10 dark:bg-[#080b11]">
            <h3 className="mb-2 text-lg font-semibold text-foreground dark:text-white">Veritabanı bağlantısı yapılmadı</h3>
            <p className="text-sm text-muted-foreground dark:text-white/60">
              MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD ve MYSQL_DATABASE değerlerini tanımlaman gerekiyor.
            </p>
          </div>
        ) : filteredListings.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {filteredListings.map((listing, index) => (
                <ListingCard key={listing.id} listing={listing} variant="featured-showcase" badgeType={index} />
              ))}
            </div>

            <div className="mt-10 flex justify-center">
              <Link
                href="/listings"
                className="inline-flex min-h-14 items-center justify-center rounded-t-2xl rounded-b-none border border-black/10 bg-white px-8 text-base font-semibold text-foreground shadow-sm transition-colors hover:bg-[#fff7f0] dark:border-white/10 dark:bg-[#080b11] dark:text-white dark:hover:bg-[#0d121b]"
              >
                {lang === 'tr' ? 'Daha Fazla İlan Gör' : 'See More Listings'}
              </Link>
            </div>
          </>
        ) : (
          <div className="rounded-[24px] border border-black/10 bg-white px-6 py-16 text-center text-muted-foreground dark:border-white/10 dark:bg-[#080b11] dark:text-white/70">
            {t.listings.noListingsDesc}
          </div>
        )}
      </div>
    </section>
  )
}
