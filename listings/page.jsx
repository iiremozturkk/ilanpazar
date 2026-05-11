'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'
import Navbar from '@/components/navbar'
import Footer from '@/components/footer'
import ListingCard from '@/components/listing-card'
import { useLanguage } from '@/components/language-provider'
import { CATEGORIES } from '@/lib/i18n'

export default function ListingsPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [listings, setListings] = useState([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })
  const [loading, setLoading] = useState(true)
  const [filterOpen, setFilterOpen] = useState(false)

  // Filter state
  const [filters, setFilters] = useState({
    q: searchParams.get('q') || '',
    category: searchParams.get('category') || 'all',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    sort: searchParams.get('sort') || 'newest',
    page: parseInt(searchParams.get('page') || '1'),
  })

  const fetchListings = useCallback(async (f) => {
    setLoading(true)
    const params = new URLSearchParams()
    if (f.q) params.set('q', f.q)
    if (f.category && f.category !== 'all') params.set('category', f.category)
    if (f.minPrice) params.set('minPrice', f.minPrice)
    if (f.maxPrice) params.set('maxPrice', f.maxPrice)
    if (f.sort) params.set('sort', f.sort)
    params.set('page', f.page)

    try {
      const res = await fetch(`/api/listings?${params}`)
      const data = await res.json()
      setListings(data.listings || [])
      setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 })
    } catch {
      setListings([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchListings(filters)
  }, [filters, fetchListings])

  const applyFilter = (key, value) => {
    setFilters(prev => {
      const next = { ...prev, [key]: value, page: 1 }
      return next
    })
  }

  const resetFilters = () => {
    setFilters({ q: '', category: 'all', minPrice: '', maxPrice: '', sort: 'newest', page: 1 })
  }

  const changePage = (p) => {
    setFilters(prev => ({ ...prev, page: p }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const activeFilterCount = [
    filters.category !== 'all',
    filters.minPrice,
    filters.maxPrice,
    filters.sort !== 'newest',
  ].filter(Boolean).length

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-foreground mb-2">{t.nav.listings}</h1>
          <p className="text-muted-foreground">
            {pagination.total} {t.filter.results}
          </p>
        </div>

        {/* Search + Filter bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Search */}
          <div className="flex-1 relative">
            <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={filters.q}
              onChange={e => applyFilter('q', e.target.value)}
              placeholder={t.filter.search}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-input bg-card text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
            />
            {filters.q && (
              <button onClick={() => applyFilter('q', '')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X size={16} />
              </button>
            )}
          </div>

          {/* Sort */}
          <div className="relative">
            <select
              value={filters.sort}
              onChange={e => applyFilter('sort', e.target.value)}
              // Native <select> can paint a separate background behind the arrow on some browsers.
              // Using appearance-none + custom chevron keeps the background consistent in dark mode.
              className="appearance-none w-full px-4 py-3 pr-10 rounded-xl border border-input bg-card text-foreground outline-none focus:outline-none focus:ring-0 focus:border-primary transition-colors text-sm"
            >
              <option value="newest">{t.filter.newest}</option>
              <option value="price_asc">{t.filter.priceAsc}</option>
              <option value="price_desc">{t.filter.priceDesc}</option>
            </select>
            <ChevronDown
              size={16}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
          </div>

          {/* Filter toggle (mobile) */}
          <button
            onClick={() => setFilterOpen(v => !v)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-colors text-sm font-medium sm:hidden ${
              filterOpen || activeFilterCount > 0
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-input bg-card text-foreground'
            }`}
          >
            <SlidersHorizontal size={16} />
            {t.filter.title}
            {activeFilterCount > 0 && (
              <span className="ml-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        <div className="flex gap-6">
          {/* Sidebar Filters */}
          <aside className={`${filterOpen ? 'block' : 'hidden'} sm:block w-full sm:w-60 lg:w-64 shrink-0`}>
            <div className="bg-card rounded-2xl border border-border p-5 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">{t.filter.title}</h3>
                {activeFilterCount > 0 && (
                  <button onClick={resetFilters} className="text-xs text-primary hover:underline">
                    {t.filter.reset}
                  </button>
                )}
              </div>

              {/* Categories */}
              <div className="mb-6">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  {t.filter.category}
                </h4>
                <div className="space-y-1">
                  <button
                    onClick={() => applyFilter('category', 'all')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      filters.category === 'all'
                        ? 'bg-primary text-primary-foreground font-medium'
                        : 'text-foreground hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    {t.categories.all}
                  </button>
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => applyFilter('category', cat.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                        filters.category === cat.id
                          ? 'bg-primary text-primary-foreground font-medium'
                          : 'text-foreground hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                    >
                      <span>{cat.icon}</span>
                      {t.categories[cat.id]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price range */}
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  {t.filter.priceRange}
                </h4>
                <div className="space-y-2">
                  <input
                    type="number"
                    value={filters.minPrice}
                    onChange={e => applyFilter('minPrice', e.target.value)}
                    placeholder={t.filter.minPrice}
                    min="0"
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
                  />
                  <input
                    type="number"
                    value={filters.maxPrice}
                    onChange={e => applyFilter('maxPrice', e.target.value)}
                    placeholder={t.filter.maxPrice}
                    min="0"
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>
            </div>
          </aside>

          {/* Listings grid */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="bg-card rounded-2xl border border-border overflow-hidden">
                    <div className="aspect-[4/3] bg-muted shimmer" />
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-muted rounded shimmer" />
                      <div className="h-4 bg-muted rounded w-2/3 shimmer" />
                      <div className="h-6 bg-muted rounded w-1/2 shimmer" />
                    </div>
                  </div>
                ))}
              </div>
            ) : listings.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {listings.map((listing, i) => (
                    <div key={listing.id} className="animate-slide-up" style={{ animationDelay: `${i * 40}ms` }}>
                      <ListingCard listing={listing} highlightTerm={filters.q} />
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-10">
                    <button
                      onClick={() => changePage(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                      className="flex items-center gap-1 px-4 py-2 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-0"
                    >
                      <ChevronLeft size={16} />
                      {t.common.previous}
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        const p = i + 1
                        return (
                          <button
                            key={p}
                            onClick={() => changePage(p)}
                            className={`w-10 h-10 rounded-xl text-sm font-medium transition-colors ${
                              p === pagination.page
                                ? 'bg-primary text-primary-foreground'
                                : 'border border-border text-foreground hover:bg-black/5 dark:hover:bg-white/5'
                            }`}
                          >
                            {p}
                          </button>
                        )
                      })}
                    </div>

                    <button
                      onClick={() => changePage(pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages}
                      className="flex items-center gap-1 px-4 py-2 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-0"
                    >
                      {t.common.next}
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="text-7xl mb-6 animate-float">🔍</div>
                <h3 className="text-2xl font-bold text-foreground mb-2">{t.listings.noListings}</h3>
                <p className="text-muted-foreground mb-6">{t.listings.noListingsDesc}</p>
                <button
                  onClick={resetFilters}
                  className="px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90 transition-opacity"
                >
                  {t.filter.reset}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}