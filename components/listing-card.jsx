'use client'

import Link from 'next/link'
import { MapPin, Eye } from 'lucide-react'
import { useLanguage } from './language-provider'
import { CATEGORIES } from '@/lib/i18n'
import FavoriteButton from '@/components/favorite-button'

function formatPrice(price, currency) {
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(price || 0) + ' ' + currency
}

function formatViews(value) {
  const total = Number(value || 0)
  if (total >= 1000) {
    return `${(total / 1000).toFixed(1).replace(/\.0$/, '')}K`
  }
  return String(total)
}

function getBadgeContent(listing, index, lang, t) {
  if (Number(index) === 0) {
    return { text: lang === 'tr' ? 'Öne Çıkan' : t.listings.featured, className: 'bg-primary text-black' }
  }
  if (Number(index) === 1) {
    return { text: 'VIP', className: 'bg-[#ffb000] text-black' }
  }
  if (Number(index) === 3 || Number(index) === 6) {
    return { text: lang === 'tr' ? 'İndirim' : 'Discount', className: 'bg-[#22c55e] text-black' }
  }
  if (listing.category === 'realestate') {
    return { text: lang === 'tr' ? 'Öne Çıkan' : t.listings.featured, className: 'bg-primary text-black' }
  }
  return null
}

export default function ListingCard({ listing, featured = false, highlightTerm = '', variant = 'default', badgeType = 0 }) {
  const { t, lang } = useLanguage()
  const cat = CATEGORIES.find(c => c.id === listing.category)

  const highlightTitle = (title, term) => {
    const q = (term || '').trim()
    if (!q) return title

    const tokens = q
      .split(/\s+/)
      .map(s => s.trim())
      .filter(s => s.length >= 2)

    if (tokens.length === 0) return title

    const escaped = tokens.map(token => token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    const re = new RegExp(`(${escaped.join('|')})`, 'gi')
    const tokenSet = new Set(tokens.map(s => s.toLowerCase()))
    const parts = String(title).split(re)

    return parts.map((part, idx) => {
      if (!part) return <span key={idx} />
      if (tokenSet.has(part.toLowerCase())) {
        return (
          <mark
            key={idx}
            className="rounded px-1 bg-amber-200/60 dark:bg-amber-500/20 text-foreground"
          >
            {part}
          </mark>
        )
      }
      return <span key={idx}>{part}</span>
    })
  }

  if (variant === 'featured-showcase') {
    const categoryName = t.categories[listing.category] || listing.category
    const previousPrice = Number(listing.price || 0) > 0 && Number(badgeType) === 3
      ? Math.round(Number(listing.price) * 1.12)
      : null

    return (
      <Link
        href={`/listings/${listing.id}`}
        className="group block overflow-hidden rounded-[20px] border border-black/10 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.08)] transition-transform duration-300 hover:-translate-y-1 dark:border-white/10 dark:bg-black dark:shadow-[0_18px_40px_rgba(0,0,0,0.28)]"
      >
        <div className="relative aspect-[1.18/1] overflow-hidden bg-[#eef2f7] dark:bg-[#0a0d14]">
          {listing.cover_image ? (
            <img
              src={listing.cover_image}
              alt={listing.title}
              className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#eef2f7] text-5xl dark:bg-[#0f131c]">
              {cat?.icon || '📦'}
            </div>
          )}

          <div className="absolute right-3 top-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#5e6670]/90 text-white backdrop-blur-sm">
              <FavoriteButton listingId={listing.id} size={17} className="text-white" />
            </div>
          </div>
        </div>

        <div className="space-y-3 p-4 text-foreground dark:text-white">
          <h3 className="min-h-[56px] text-[15px] font-extrabold leading-7 text-foreground transition-colors group-hover:text-primary line-clamp-2 dark:text-white">
            {highlightTitle(listing.title, highlightTerm)}
          </h3>

          <div>
            <div className="text-[18px] font-extrabold leading-none text-primary sm:text-[20px]">
              {formatPrice(listing.price, t.common.currency)}
            </div>
            {previousPrice ? (
              <div className="mt-1 text-sm text-muted-foreground/60 line-through dark:text-white/35">
                {formatPrice(previousPrice, t.common.currency)}
              </div>
            ) : null}
          </div>

          <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground dark:text-white/55">
            <div className="flex min-w-0 items-center gap-1.5">
              <MapPin size={12} className="shrink-0" />
              <span className="truncate">{listing.location || categoryName}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 border-t border-black/8 pt-3 text-xs text-muted-foreground dark:border-white/8 dark:text-white/55">
            <Eye size={12} className="shrink-0" />
            <span>{formatViews(listing.views)}</span>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group block bg-card rounded-2xl overflow-hidden border border-border card-hover"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {listing.cover_image ? (
          <img
            src={listing.cover_image}
            alt={listing.title}
            className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl bg-muted">
            {cat?.icon || '📦'}
          </div>
        )}

        <div className="absolute top-3 right-3">
          <div className="rounded-full bg-card/80 backdrop-blur-sm border border-border shadow-sm">
            <FavoriteButton listingId={listing.id} size={16} className="hover:scale-110" />
          </div>
        </div>

        <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2.5 py-1 bg-card/80 backdrop-blur-sm rounded-full text-xs text-muted-foreground border border-border">
          <Eye size={11} />
          {listing.views || 0}
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-foreground text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors mb-2">
          {highlightTitle(listing.title, highlightTerm)}
        </h3>

        <div className="text-lg font-bold text-primary mb-3">
          {formatPrice(listing.price, t.common.currency)}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {listing.location && (
            <div className="flex items-center gap-1 min-w-0">
              <MapPin size={11} className="shrink-0" />
              <span className="truncate">{listing.location}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
