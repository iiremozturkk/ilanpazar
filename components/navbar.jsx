'use client'

import { useMemo, useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Menu, X, Plus, ChevronDown, Sun, Moon, LogOut, LayoutDashboard, Search, ShoppingBasket, ShoppingCart, Heart, Bell, Package, Truck, User, MessageCircle } from 'lucide-react'
import { useLanguage } from './language-provider'
import { localizeNotification } from '@/lib/notification-i18n'
import { useAuth } from '@/hooks/use-auth'
import { useTheme } from 'next-themes'
import { useFavorites } from '@/components/favorites-provider'
import { useCart } from '@/components/cart-provider'
import { CATEGORIES } from '@/lib/i18n'

// Lightweight subcategory suggestions (UI only).
// We route them as a search query inside the chosen category.
const SUBCATEGORIES = {
  electronics: {
    tr: ['Telefon', 'Bilgisayar', 'Tablet', 'Kulaklık', 'Oyun Konsolu', 'Akıllı Saat'],
    en: ['Phones', 'Computers', 'Tablets', 'Headphones', 'Consoles', 'Smart Watches'],
  },
  vehicles: {
    tr: ['Otomobil', 'Motosiklet', 'SUV', 'Ticari', 'Elektrikli', 'Yedek Parça'],
    en: ['Cars', 'Motorcycles', 'SUV', 'Commercial', 'Electric', 'Spare Parts'],
  },
  realestate: {
    tr: ['Satılık', 'Kiralık', 'Daire', 'Arsa', 'İşyeri', 'Devremülk'],
    en: ['For Sale', 'For Rent', 'Apartments', 'Land', 'Commercial', 'Timeshare'],
  },
  fashion: {
    tr: ['Kadın', 'Erkek', 'Çocuk', 'Ayakkabı', 'Aksesuar', 'Çanta'],
    en: ['Women', 'Men', 'Kids', 'Shoes', 'Accessories', 'Bags'],
  },
  home: {
    tr: ['Mobilya', 'Beyaz Eşya', 'Dekorasyon', 'Mutfak', 'Aydınlatma', 'Bahçe'],
    en: ['Furniture', 'Appliances', 'Decor', 'Kitchen', 'Lighting', 'Garden'],
  },
  sports: {
    tr: ['Fitness', 'Futbol', 'Kamp', 'Bisiklet', 'Koşu', 'Outdoor'],
    en: ['Fitness', 'Football', 'Camping', 'Bicycles', 'Running', 'Outdoor'],
  },
  books: {
    tr: ['Roman', 'Ders Kitabı', 'Çizgi Roman', 'Puzzle', 'Koleksiyon', 'Enstrüman'],
    en: ['Novels', 'Textbooks', 'Comics', 'Puzzle', 'Collectibles', 'Instruments'],
  },
  other: {
    tr: ['Hizmet', 'Bilet', 'Evcil Hayvan', 'Antika', 'El Yapımı', 'Diğer'],
    en: ['Services', 'Tickets', 'Pets', 'Antiques', 'Handmade', 'Other'],
  },
}

export default function Navbar() {
  const { t, lang, setLanguage } = useLanguage()
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const { count: favCount, hydrated: favHydrated } = useFavorites()
  const { count: cartCount, hydrated: cartHydrated } = useCart()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifLoading, setNotifLoading] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [selectedNotifIds, setSelectedNotifIds] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [mounted, setMounted] = useState(false)

  // Categories dropdown (desktop + mobile)
  const [catOpen, setCatOpen] = useState(false)
  const [mobileCatOpen, setMobileCatOpen] = useState(false)
  const [catQuery, setCatQuery] = useState('')
  const [catCounts, setCatCounts] = useState(null)
  const [catCountsLoading, setCatCountsLoading] = useState(false)
  const [activeCatId, setActiveCatId] = useState(CATEGORIES?.[0]?.id || 'electronics')
  const catRef = useRef(null)
  const catCloseTimer = useRef(null)
  const notifRef = useRef(null)

  useEffect(() => {
    setMounted(true)
    const fn = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  // Close dropdowns on outside click / escape
  useEffect(() => {
    const onDown = (e) => {
      if (catRef.current && !catRef.current.contains(e.target)) setCatOpen(false)
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setCatOpen(false)
        setUserMenuOpen(false)
        setNotifOpen(false)
      }
    }
    window.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  const unreadCount = useMemo(
    () => (Array.isArray(notifications) ? notifications.filter(n => !n.is_read).length : 0),
    [notifications]
  )

  const loadNotifications = async () => {
    if (notifLoading) return
    setNotifLoading(true)
    try {
      const res = await fetch('/api/notifications')
      const data = await res.json().catch(() => ({}))
      if (res.ok) setNotifications(Array.isArray(data?.notifications) ? data.notifications : [])
    } catch {
      // silent
    } finally {
      setNotifLoading(false)
    }
  }

  const markAllRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_all_read' }),
      })
    } catch {}
    setNotifications(prev => (Array.isArray(prev) ? prev.map(n => ({ ...n, is_read: 1 })) : prev))
  }

  const toggleNotifSelect = (id) => {
    setSelectedNotifIds((prev) => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]))
  }

  const selectAllNotifs = () => {
    setSelectedNotifIds((prev) => (prev.length === (notifications?.length || 0) ? [] : (notifications || []).map(n => n.id)))
  }

  const deleteSelectedNotifs = async () => {
    if (!user) return
    const ids = selectedNotifIds
    if (!ids.length) return
    try {
      const res = await fetch('/api/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      })
      if (res.ok) {
        setNotifications((prev) => (prev || []).filter(n => !ids.includes(n.id)))
        setSelectedNotifIds([])
      }
    } catch {
      // noop
    }
  }

  // Preload category counts when dropdown opens
  useEffect(() => {
    if (catOpen || mobileCatOpen) loadCategoryCounts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catOpen, mobileCatOpen])

  const handleLogout = async () => {
    await logout()
    toast.success(lang === 'tr' ? 'Çıkış yapıldı' : 'Logged out')
    router.push('/')
    setUserMenuOpen(false)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/listings?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : ''

  const isDark = mounted ? theme === 'dark' : true
  const navBg = scrolled ? 'var(--brand-navbar-bg)' : (isDark ? 'rgba(10,10,12,0.72)' : 'rgba(255,255,255,0.86)')
  const navBorder = scrolled ? 'var(--brand-navbar-border)' : (isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)')

  const filteredCategories = CATEGORIES.filter((c) => {
    const label = (t?.categories?.[c.id] || c.id).toString().toLowerCase()
    return label.includes(catQuery.trim().toLowerCase())
  })

  const popularCategories = (() => {
    if (!catCounts) return CATEGORIES.slice(0, 4)
    return [...CATEGORIES]
      .sort((a, b) => (catCounts[b.id] || 0) - (catCounts[a.id] || 0))
      .slice(0, 4)
  })()

  const closeAllDropdowns = () => {
    setCatOpen(false)
    setMenuOpen(false)
    setMobileCatOpen(false)
    setCatQuery('')
  }

  const goCategory = (id) => {
    closeAllDropdowns()
    router.push(`/listings?category=${id}`)
  }

  const goSubcategory = (catId, label) => {
    closeAllDropdowns()
    // listings page already understands `q` as a search query.
    router.push(`/listings?category=${catId}&q=${encodeURIComponent(label)}`)
  }

  const loadCategoryCounts = async () => {
    if (catCountsLoading || catCounts) return
    try {
      setCatCountsLoading(true)
      const res = await fetch('/api/categories/counts')
      const data = await res.json()
      setCatCounts(data?.counts || {})
    } catch {
      // ignore
    } finally {
      setCatCountsLoading(false)
    }
  }

  const openCats = () => {
    if (catCloseTimer.current) clearTimeout(catCloseTimer.current)
    setCatOpen(true)
    loadCategoryCounts()
  }

  const scheduleCloseCats = () => {
    if (catCloseTimer.current) clearTimeout(catCloseTimer.current)
    catCloseTimer.current = setTimeout(() => setCatOpen(false), 140)
  }

  return (
    <>
    <header
      className={`fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-xl transition-all duration-300 ${
        scrolled ? 'shadow-lg' : ''
      }`}
      style={{
        background: navBg,
        borderColor: navBorder,
        boxShadow: scrolled ? 'var(--brand-card-shadow)' : 'none',
      }}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-1.5">
          {/* Top row: logo left, actions right */}
          <div className="flex items-center justify-between h-11 md:h-12 gap-3">
{/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div
              className="relative w-9 h-9 rounded-xl overflow-hidden shadow-lg transition-transform duration-200 group-hover:scale-105 bg-white dark:bg-transparent"
              style={{ boxShadow: '0 4px 16px rgba(249,115,22,0.35)' }}
            >
              <Image
                src={isDark ? "/logo.png" : "/logo.png"}
                alt="ilanpazar"
                fill
                className="object-cover"
                sizes="36px"
              />
            </div>
            <span className="text-[17px] font-extrabold text-foreground dark:text-white tracking-tight" style={{ textShadow: isDark ? '0 1px 10px rgba(0,0,0,0.35)' : 'none' }}>
              ilan<span style={{ color: 'var(--brand-orange)' }}>pazar</span>
            </span>
          </Link>
          {/* Right side */}
          <div className="flex items-center justify-end gap-1.5">
            {/* Language toggle (desktop) */}
            <div className="hidden sm:flex items-center gap-1 mr-1">
              <button
                onClick={() => setLanguage('tr')}
                className="px-2 py-1 rounded-lg text-xs font-bold transition-all"
                style={{
                  background: lang === 'tr' ? 'color-mix(in oklab, var(--brand-orange) 20%, transparent)' : 'transparent',
                  color: lang === 'tr' ? 'var(--brand-orange)' : (isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)'),
                }}
              >
                TR
              </button>
              <span className="text-xs" style={{ color: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)' }}>/</span>
              <button
                onClick={() => setLanguage('en')}
                className="px-2 py-1 rounded-lg text-xs font-bold transition-all"
                style={{
                  background: lang === 'en' ? 'color-mix(in oklab, var(--brand-orange) 20%, transparent)' : 'transparent',
                  color: lang === 'en' ? 'var(--brand-orange)' : (isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)'),
                }}
              >
                EN
              </button>
            </div>

            {/* Theme toggle */}
            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className="p-2 rounded-lg transition-all duration-200 hover:bg-black/5 dark:hover:bg-white/10 text-foreground dark:text-white/85"
              aria-label={lang === 'tr' ? 'Görünüm' : 'Appearance'}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Favorites */}
            <Link
              href={user ? '/favorites' : '/login'}
              className="relative p-2 rounded-lg transition-all duration-200 hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 hover:scale-105"
              aria-label={lang === 'tr' ? 'Favorilerim' : 'My Favorites'}
              style={{ color: isDark ? 'rgba(255,255,255,0.88)' : 'rgba(0,0,0,0.72)' }}
            >
              <Heart size={18} />
              {favHydrated && favCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[11px] font-bold flex items-center justify-center"
                  style={{ background: 'var(--brand-orange)', color: '#fff' }}
                >
                  {favCount}
                </span>
              )}
            </Link>

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={async () => {
                  setNotifOpen(v => !v)
                  if (!notifOpen) await loadNotifications()
                }}
                className="relative p-2 rounded-lg transition-all duration-200 hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 hover:scale-105"
                aria-label={lang === 'tr' ? 'Bildirimler' : 'Notifications'}
                style={{ color: isDark ? 'rgba(255,255,255,0.88)' : 'rgba(0,0,0,0.72)' }}
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span
                    className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[11px] font-bold flex items-center justify-center"
                    style={{ background: 'var(--brand-orange)', color: '#fff' }}
                  >
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-[340px] max-w-[92vw] rounded-2xl shadow-2xl overflow-hidden animate-scale-in z-[80]"
                  style={{
                    background: isDark ? '#1a1a1a' : '#ffffff',
                    border: isDark ? '1px solid rgba(255,255,255,0.09)' : '1px solid rgba(0,0,0,0.08)',
                  }}
                >
                  <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)' }}>
                    <div>
                      <div className="text-sm font-extrabold text-foreground dark:text-white">{lang === 'tr' ? 'Bildirimler' : 'Notifications'}</div>
                      <div className="text-xs" style={{ color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.55)' }}>
                        {lang === 'tr' ? 'Kupon, kargo ve sipariş güncellemeleri' : 'Coupons, shipping and order updates'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!!notifications?.length && user && (
                        <button
                          type="button"
                          onClick={selectAllNotifs}
                          className="text-xs font-bold px-2.5 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/8 whitespace-nowrap"
                          style={{ color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}
                        >
                          {lang === 'tr'
                            ? (selectedNotifIds.length === notifications.length ? 'Seçimi kaldır' : 'Tümünü seç')
                            : (selectedNotifIds.length === notifications.length ? 'Clear' : 'Select all')}
                        </button>
                      )}
                      {user && (
                        <button
                          type="button"
                          onClick={markAllRead}
                          className="text-xs font-bold px-2.5 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/8 whitespace-nowrap"
                          style={{ color: 'var(--brand-orange)' }}
                        >
                          {lang === 'tr' ? 'Hepsi okundu' : 'Mark all read'}
                        </button>
                      )}
                    </div>
                  </div>

                  {user && selectedNotifIds.length > 0 && (
                    <div className="px-4 py-2 flex items-center justify-between" style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)' }}>
                      <div className="text-xs" style={{ color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.55)' }}>
                        {lang === 'tr' ? `${selectedNotifIds.length} seçildi` : `${selectedNotifIds.length} selected`}
                      </div>
                      <button
                        type="button"
                        onClick={deleteSelectedNotifs}
                        className="text-xs font-extrabold px-2.5 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/8 whitespace-nowrap"
                        style={{ color: '#ef4444' }}
                      >
                        {lang === 'tr' ? 'Seçileni sil' : 'Delete selected'}
                      </button>
                    </div>
                  )}

                  <div className="max-h-[360px] overflow-auto">
                    {notifLoading ? (
                      <div className="p-4 text-sm text-muted-foreground">{lang === 'tr' ? 'Yükleniyor...' : 'Loading...'}</div>
                    ) : notifications?.length ? (
                      notifications.map((raw) => {
                        const n = localizeNotification(raw, lang)
                        const checked = selectedNotifIds.includes(raw.id)

                        return (
                          <div
                            key={raw.id}
                            className="px-4 py-3 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                          >
                            <div className="flex items-start gap-3">
                              {user && (
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleNotifSelect(raw.id)}
                                  className="mt-1.5 accent-[var(--brand-orange)]"
                                  aria-label={lang === 'tr' ? 'Bildirimi seç' : 'Select notification'}
                                />
                              )}
                              <div
                                className="mt-1 w-2.5 h-2.5 rounded-full"
                                style={{ background: raw.is_read ? 'transparent' : 'var(--brand-orange)', border: raw.is_read ? (isDark ? '1px solid rgba(255,255,255,0.14)' : '1px solid rgba(0,0,0,0.12)') : 'none' }}
                              />
                              <Link
                                href={raw.link || '/'}
                                onClick={() => setNotifOpen(false)}
                                className="min-w-0 block"
                              >
                                <div className="text-sm font-semibold text-foreground dark:text-white truncate">{n.title}</div>
                                <div className="text-xs mt-0.5" style={{ color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.6)' }}>
                                  {n.message}
                                </div>
                                {raw.created_at && (
                                  <div className="text-[11px] mt-1" style={{ color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.45)' }}>
                                    {new Date(raw.created_at).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')}
                                  </div>
                                )}
                              </Link>
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <div className="p-4 text-sm text-muted-foreground">
                        {user ? (lang === 'tr' ? 'Henüz bildirim yok.' : 'No notifications yet.') : (lang === 'tr' ? 'Bildirimler için giriş yap.' : 'Login to see notifications.')}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* (Cart + Post Ad moved next to the search bar) */}

            {/* Auth or user menu */}
            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/cart"
                  className="relative hidden md:flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
                  aria-label={lang === 'tr' ? 'Sepet' : 'Cart'}
                  style={{
                    color: isDark ? '#fff' : 'var(--foreground)',
                  }}
                >
                  <ShoppingBasket size={19} strokeWidth={2.3} />
                  {cartHydrated && cartCount > 0 && (
                    <span
                      className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[11px] font-bold flex items-center justify-center"
                      style={{ background: 'var(--brand-orange)', color: '#fff' }}
                    >
                      {cartCount}
                    </span>
                  )}
                </Link>

                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(v => !v)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition-all duration-200 hover:bg-black/5 dark:hover:bg-white/5"
                    style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)' }}
                  >
                    <div
                      className="relative w-7 h-7 rounded-full overflow-hidden flex items-center justify-center text-foreground dark:text-white text-xs font-bold"
                      style={{ background: 'var(--brand-orange)' }}
                    >
                      {user?.avatar_url ? (
                        <Image
                          src={user.avatar_url}
                          alt={user.name || 'User avatar'}
                          fill
                          className="object-cover"
                          sizes="28px"
                        />
                      ) : (
                        initials
                      )}
                    </div>
                    <span className="hidden md:block max-w-[140px] truncate text-sm font-semibold text-foreground dark:text-white">
                      {user.name}
                    </span>
                    <ChevronDown
                      size={13}
                      style={{
                        color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)',
                        transform: userMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                      }}
                    />
                  </button>

                {userMenuOpen && (
                  <div
                    className="absolute right-0 top-full mt-2 w-52 rounded-2xl shadow-2xl overflow-hidden animate-scale-in z-[80]"
                    style={{
                      background: isDark ? '#1a1a1a' : '#ffffff',
                      border: isDark ? '1px solid rgba(255,255,255,0.09)' : '1px solid rgba(0,0,0,0.08)',
                    }}
                  >
                    <div className="px-4 py-3" style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)' }}>
                      <p className="text-sm font-semibold text-foreground dark:text-white truncate">{user.name}</p>
                      <p className="text-xs truncate" style={{ color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.55)' }}>{user.email}</p>
                    </div>
                    <Link href="/dashboard" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-3 text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/5 text-foreground dark:text-white/80">
                      <LayoutDashboard size={14} />
                      {t.nav.dashboard}
                    </Link>
                    <Link href="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-3 text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/5 text-foreground dark:text-white/80">
                      <User size={14} />
                      {lang === 'tr' ? 'Profili Düzenle' : 'Edit Profile'}
                    </Link>
                    <Link href="/my-orders" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-3 text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/5 text-foreground dark:text-white/80">
                      <Package size={14} />
                      {lang === 'tr' ? 'Siparişlerim' : 'My Orders'}
                    </Link>
                    <Link href="/sales" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-3 text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/5 text-foreground dark:text-white/80">
                      <Truck size={14} />
                      {lang === 'tr' ? 'Satışlarım' : 'My Sales'}
                    </Link>
                    <Link href="/messages" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-3 text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/5 text-foreground dark:text-white/80">
                      <MessageCircle size={14} />
                      {lang === 'tr' ? 'Mesajlar' : 'Messages'}
                    </Link>
                    <Link href="/dashboard/new" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-3 text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/5 text-foreground dark:text-white/80">
                      <Plus size={14} />
                      {t.nav.postAd}
                    </Link>
                    <hr style={{ borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }} />
                    <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-400 hover:bg-white/5 transition-colors">
                      <LogOut size={14} />
                      {t.nav.logout}
                    </button>
                  </div>
                )}
                </div>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden sm:flex px-4 py-2 text-sm font-semibold text-foreground dark:text-white rounded-full transition-all duration-200 hover:bg-black/5 dark:hover:bg-white/8 hover:scale-105"
                  style={{ border: isDark ? '1px solid rgba(255,255,255,0.22)' : '1px solid rgba(0,0,0,0.12)', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.72)' }}
                >
                  {lang === 'tr' ? 'Giriş Yap' : 'Login'}
                </Link>
                <Link
                  href="/register"
                  className="hidden sm:flex px-4 py-2 text-sm font-semibold rounded-full transition-all duration-200 hover:scale-105 active:scale-95"
                  style={{
                    background: isDark ? 'rgba(255,255,255,0.95)' : 'var(--brand-orange)',
                    color: isDark ? '#111' : '#fff',
                  }}
                >
                  {lang === 'tr' ? 'Kayıt Ol' : 'Sign Up'}
                </Link>
              </>
            )}

            {/* Mobile menu toggle */}
            <button
              className="sm:hidden p-2 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/10 text-foreground dark:text-white/90"
              onClick={() => setMenuOpen(v => !v)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

          {/* Second row: categories + search side-by-side */}
          <div className="mt-1.5 flex items-center gap-3">
            {/* Categories button (mobile) */}
            <button
              type="button"
              onClick={() => router.push('/listings')}
              className="md:hidden flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-200 hover:bg-black/5 dark:hover:bg-white/8 shrink-0"
              style={{
                borderColor: 'rgba(249,115,22,0.65)',
                background: 'color-mix(in oklab, var(--card) 90%, transparent)',
                boxShadow: '0 0 0 1px rgba(249,115,22,0.08) inset',
              }}
            >
              <span className="text-sm font-semibold text-foreground dark:text-white">
                {lang === 'tr' ? 'Kategoriler' : 'Categories'}
              </span>
              <ChevronDown size={14} style={{ opacity: 0.7 }} />
            </button>

            {/* Categories (desktop) */}
{/* Categories (desktop) — hover mega menu */}
          <div
            className="relative hidden md:flex items-center shrink-0"
            ref={catRef}
            onMouseEnter={openCats}
            onMouseLeave={scheduleCloseCats}
          >
            <button
              type="button"
              onClick={() => (catOpen ? setCatOpen(false) : openCats())}
              onMouseEnter={openCats}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-200 hover:bg-black/5 dark:hover:bg-white/8"
              style={{
                borderColor: 'rgba(249,115,22,0.65)',
                background: 'color-mix(in oklab, var(--card) 90%, transparent)',
                boxShadow: '0 0 0 1px rgba(249,115,22,0.08) inset',
              }}
              aria-haspopup="menu"
              aria-expanded={catOpen}
            >
              <span className="text-sm font-semibold text-foreground dark:text-white">
                {lang === 'tr' ? 'Kategoriler' : 'Categories'}
              </span>
              <ChevronDown
                size={14}
                style={{
                  transform: catOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease',
                  opacity: 0.7,
                }}
              />
            </button>

            {catOpen && (
              <div
                className="absolute left-0 top-full mt-2 w-[760px] rounded-2xl shadow-2xl overflow-hidden border"
                style={{
                  background: 'color-mix(in oklab, var(--card) 96%, transparent)',
                  borderColor: 'color-mix(in oklab, var(--border) 70%, transparent)',
                }}
                role="menu"
                onMouseEnter={openCats}
                onMouseLeave={scheduleCloseCats}
              >
                <div className="p-4">
                  {/* Search */}
                  <div
                    className="flex items-center gap-2 rounded-xl px-3 py-2.5 border"
                    style={{
                      background: 'color-mix(in oklab, var(--card) 85%, transparent)',
                      borderColor: 'color-mix(in oklab, var(--border) 75%, transparent)',
                    }}
                  >
                    <Search size={14} style={{ color: 'color-mix(in oklab, var(--muted-foreground) 75%, transparent)' }} />
                    <input
                      value={catQuery}
                      onChange={(e) => setCatQuery(e.target.value)}
                      placeholder={lang === 'tr' ? 'Kategori ara...' : 'Search category...'}
                      className="flex-1 bg-transparent text-sm text-foreground dark:text-white placeholder:text-muted-foreground/70 dark:placeholder:text-white/35 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => { closeAllDropdowns(); router.push('/listings') }}
                      className="text-xs font-semibold px-2.5 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/8"
                    >
                      {lang === 'tr' ? 'Tümü' : 'All'}
                    </button>
                  </div>

                  {/* 2-column mega layout */}
                  <div className="mt-4 grid grid-cols-[1fr,240px] gap-3">
                    {/* Category list */}
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground dark:text-white/45 mb-2">
                        {lang === 'tr' ? 'Tüm Kategoriler' : 'All Categories'}
                      </div>

                      <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-auto pr-1">
                        {filteredCategories.map((cat) => (
                          <button
                            key={cat.id}
                            onClick={() => goCategory(cat.id)}
                            onMouseEnter={() => setActiveCatId(cat.id)}
                            className="w-full text-left px-3 py-3 rounded-xl border transition-all duration-200 hover:bg-black/5 dark:hover:bg-white/5"
                            style={{
                              borderColor: activeCatId === cat.id
                                ? 'color-mix(in oklab, var(--brand-orange) 40%, var(--border))'
                                : 'color-mix(in oklab, var(--border) 70%, transparent)',
                              background: 'color-mix(in oklab, var(--card) 90%, transparent)',
                            }}
                          >
                            <div className="flex items-center gap-3 justify-between">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-base">{cat.icon}</span>
                                <span className="text-sm font-semibold text-foreground dark:text-white truncate">
                                  {t.categories[cat.id]}
                                </span>
                              </div>
                              <span
                                className="shrink-0 text-[11px] font-bold px-2 py-1 rounded-full"
                                style={{
                                  background: 'color-mix(in oklab, var(--brand-orange) 12%, transparent)',
                                  border: '1px solid color-mix(in oklab, var(--brand-orange) 22%, transparent)',
                                }}
                              >
                                {catCounts?.[cat.id] ?? 0}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>

                      {filteredCategories.length === 0 && (
                        <div className="mt-2 text-sm text-muted-foreground dark:text-white/40 px-1">
                          {lang === 'tr' ? 'Sonuç bulunamadı.' : 'No results found.'}
                        </div>
                      )}
                    </div>

                    {/* Subcategories panel */}
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground dark:text-white/45 mb-2">
                        {lang === 'tr' ? 'Alt Kategoriler' : 'Subcategories'}
                      </div>

                      <div
                        className="rounded-2xl border p-3"
                        style={{
                          borderColor: 'color-mix(in oklab, var(--border) 70%, transparent)',
                          background: 'color-mix(in oklab, var(--card) 90%, transparent)',
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-semibold text-foreground dark:text-white truncate">
                            {t.categories[activeCatId]}
                          </div>
                          <button
                            type="button"
                            onClick={() => goCategory(activeCatId)}
                            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/8"
                          >
                            {lang === 'tr' ? 'Tümünü gör' : 'See all'}
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {(SUBCATEGORIES?.[activeCatId]?.[lang] || []).map((label) => (
                            <button
                              key={label}
                              onClick={() => goSubcategory(activeCatId, label)}
                              className="px-3 py-1.5 text-xs font-semibold rounded-full border transition-all duration-200 hover:bg-black/5 dark:hover:bg-white/5"
                              style={{
                                borderColor: 'color-mix(in oklab, var(--border) 70%, transparent)',
                                background: 'color-mix(in oklab, var(--card) 88%, transparent)',
                              }}
                            >
                              {label}
                            </button>
                          ))}
                        </div>

                        <div className="mt-3 text-xs text-muted-foreground dark:text-white/40">
                          {lang === 'tr'
                            ? 'Alt kategoriye tıklayınca ilgili kelime ile arama yapılır.'
                            : 'Clicking a subcategory runs a search within the category.'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

            {/* Search + quick actions */}
          <div className="flex flex-1 min-w-0 items-center gap-2">
            {/* Search bar (extends left up to categories) */}
            <form
              onSubmit={handleSearch}
              className="flex-1 min-w-0 items-center gap-2 rounded-xl px-3 py-2 transition-all duration-200 flex"
              style={{
                background: 'color-mix(in oklab, var(--card) 85%, transparent)',
                border: '1px solid color-mix(in oklab, var(--border) 75%, transparent)',
              }}
              onFocus={() => {}}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'color-mix(in oklab, var(--brand-orange) 35%, var(--border))'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'color-mix(in oklab, var(--border) 75%, transparent)'}
            >
              <Search size={14} style={{ color: 'color-mix(in oklab, var(--muted-foreground) 75%, transparent)', flexShrink: 0 }} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={lang === 'tr' ? 'İlan ara...' : 'Search listings...'}
                className="flex-1 bg-transparent text-sm text-foreground dark:text-foreground dark:text-white placeholder:text-muted-foreground/70 dark:placeholder:text-white/35 outline-none"
              />
            </form>

            <div className="hidden sm:flex items-center gap-2">
              {/* Start Shopping */}
              <Link
                href="/listings"
                className="items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-full transition-all duration-200 hover:scale-105 active:scale-95 hidden md:flex"
                style={{
                  color: isDark ? '#fff' : 'var(--foreground)',
                  background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.82)',
                  border: isDark ? '1px solid rgba(255,255,255,0.14)' : '1px solid rgba(0,0,0,0.08)',
                }}
              >
                <ShoppingCart size={15} strokeWidth={2.3} />
                {lang === 'tr' ? 'Alışverişe Başla' : 'Start Shopping'}
              </Link>

              {/* Post Ad */}
              <Link
                href={user ? '/dashboard/new' : '/register'}
                className="items-center gap-1.5 px-4 py-2 text-white text-sm font-bold rounded-full transition-all duration-200 hover:scale-105 active:scale-95 hidden md:flex"
                style={{
                  background: 'var(--brand-orange)',
                  boxShadow: '0 4px 14px rgba(249,115,22,0.35)',
                }}
              >
                <Plus size={15} strokeWidth={2.5} />
                {lang === 'tr' ? 'İlan Ver' : 'Post Ad'}
              </Link>
            </div>
          </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {menuOpen && (
        <div
          className="sm:hidden border-t px-4 py-4 space-y-2 animate-slide-up"
          style={{
            background: 'var(--brand-hero-bg)',
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
          }}
        >
          <form onSubmit={handleSearch} className="flex items-center gap-2 rounded-xl px-3 py-2.5 mb-3" style={{ background: 'color-mix(in oklab, var(--card) 85%, transparent)', border: isDark ? '1px solid rgba(255,255,255,0.09)' : '1px solid rgba(0,0,0,0.08)' }}>
            <Search size={14} style={{ color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.55)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={lang === 'tr' ? 'İlan ara...' : 'Search...'}
              className="flex-1 bg-transparent text-sm text-foreground dark:text-foreground dark:text-white placeholder:text-muted-foreground/70 dark:placeholder:text-white/35 outline-none"
            />
          </form>
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLanguage('tr')}
                className="px-3 py-2 rounded-xl text-sm font-semibold border hover:bg-black/5 dark:hover:bg-white/5"
                style={{ borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)' }}
              >
                TR {lang === 'tr' ? '✓' : ''}
              </button>
              <button
                onClick={() => setLanguage('en')}
                className="px-3 py-2 rounded-xl text-sm font-semibold border hover:bg-black/5 dark:hover:bg-white/5"
                style={{ borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)' }}
              >
                EN {lang === 'en' ? '✓' : ''}
              </button>
            </div>
            {mounted && (
              <button
                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                className="px-3 py-2 rounded-xl text-sm font-semibold border hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2"
                style={{ borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)' }}
              >
                {isDark ? <Sun size={16} /> : <Moon size={16} />}
                {isDark ? (lang === 'tr' ? 'Koyu' : 'Dark') : (lang === 'tr' ? 'Açık' : 'Light')}
              </button>
            )}
          </div>
          <Link href="/" onClick={() => setMenuOpen(false)} className="block px-4 py-3 text-sm font-medium rounded-xl transition-colors hover:bg-black/5 dark:hover:bg-white/5 text-foreground dark:text-white/80">
            {t.nav.home}
          </Link>
          <Link href="/listings" onClick={() => setMenuOpen(false)} className="block px-4 py-3 text-sm font-medium rounded-xl transition-colors hover:bg-black/5 dark:hover:bg-white/5 text-foreground dark:text-white/80">
            {t.nav.listings}
          </Link>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Link href="/cart" onClick={() => setMenuOpen(false)} className="relative flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-center rounded-xl transition-colors border text-foreground dark:text-white/90 hover:bg-black/5 dark:hover:bg-white/5" style={{ borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)' }}>
              <ShoppingBasket size={16} strokeWidth={2.3} />
              {lang === 'tr' ? 'Sepetim' : 'My Cart'}
              {cartHydrated && cartCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[11px] font-bold flex items-center justify-center"
                  style={{ background: 'var(--brand-orange)', color: '#fff' }}
                >
                  {cartCount}
                </span>
              )}
            </Link>
            <Link href="/listings" onClick={() => setMenuOpen(false)} className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-center rounded-xl transition-colors border text-foreground dark:text-white/90 hover:bg-black/5 dark:hover:bg-white/5" style={{ borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)' }}>
              <ShoppingCart size={16} strokeWidth={2.3} />
              {lang === 'tr' ? 'Alışverişe Başla' : 'Start Shopping'}
            </Link>
            <Link href="/dashboard/new" onClick={() => setMenuOpen(false)} className="col-span-2 block px-4 py-3 text-sm font-bold text-center text-foreground dark:text-white rounded-xl hover:opacity-90 transition-opacity" style={{ background: 'var(--brand-orange)' }}>
              {lang === 'tr' ? 'İlan Ver' : 'Post Ad'}
            </Link>
          </div>

          <Link href={user ? '/favorites' : '/login'} onClick={() => setMenuOpen(false)} className="block px-4 py-3 text-sm font-medium rounded-xl transition-colors hover:bg-black/5 dark:hover:bg-white/5 text-foreground dark:text-white/80">
            {lang === 'tr' ? 'Favorilerim' : 'My Favorites'}
          </Link>

          {/* Categories (mobile) */}
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)' }}>
            <button
              type="button"
              onClick={() => setMobileCatOpen(v => !v)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-foreground dark:text-white/85 hover:bg-black/5 dark:hover:bg-white/5"
            >
              <span>{lang === 'tr' ? 'Kategoriler' : 'Categories'}</span>
              <ChevronDown size={16} style={{ transform: mobileCatOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease', opacity: 0.7 }} />
            </button>

            {mobileCatOpen && (
              <div className="px-3 pb-3">
                <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 mb-2 border" style={{ background: 'color-mix(in oklab, var(--card) 85%, transparent)', borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)' }}>
                  <Search size={14} style={{ color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.55)' }} />
                  <input
                    value={catQuery}
                    onChange={(e) => setCatQuery(e.target.value)}
                    placeholder={lang === 'tr' ? 'Kategori ara...' : 'Search category...'}
                    className="flex-1 bg-transparent text-sm text-foreground dark:text-white placeholder:text-muted-foreground/70 dark:placeholder:text-white/35 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {filteredCategories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => goCategory(cat.id)}
                      className="flex items-center gap-2 px-3 py-3 rounded-xl border text-sm hover:bg-black/5 dark:hover:bg-white/5"
                      style={{ borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)' }}
                    >
                      <span className="text-base">{cat.icon}</span>
                      <span className="font-medium truncate">{t.categories[cat.id]}</span>
                    </button>
                  ))}
                </div>

                {filteredCategories.length === 0 && (
                  <div className="mt-2 text-sm text-muted-foreground dark:text-white/40 px-1">
                    {lang === 'tr' ? 'Sonuç bulunamadı.' : 'No results found.'}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => { setMenuOpen(false); setMobileCatOpen(false); setCatQuery(''); router.push('/listings') }}
                  className="mt-2 w-full px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-black/5 dark:hover:bg-white/5"
                >
                  {lang === 'tr' ? 'Tüm Kategoriler' : 'All Categories'}
                </button>
              </div>
            )}
          </div>
          <button
            onClick={() => { setLanguage(lang === 'tr' ? 'en' : 'tr'); setMenuOpen(false) }}
            className="w-full text-left px-4 py-3 text-sm font-medium rounded-xl transition-colors hover:bg-black/5 dark:hover:bg-white/5 text-foreground dark:text-white/80"
          >
            {lang === 'tr' ? 'Switch to English' : 'Türkçeye Geç'}
          </button>
          <hr style={{ borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }} />
          {user ? (
            <>
              <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="block px-4 py-3 text-sm font-medium rounded-xl transition-colors hover:bg-black/5 dark:hover:bg-white/5 text-foreground dark:text-white/80">{t.nav.dashboard}</Link>
              <Link href="/my-orders" onClick={() => setMenuOpen(false)} className="block px-4 py-3 text-sm font-medium rounded-xl transition-colors hover:bg-black/5 dark:hover:bg-white/5 text-foreground dark:text-white/80">{lang === 'tr' ? 'Siparişlerim' : 'My Orders'}</Link>
              <Link href="/sales" onClick={() => setMenuOpen(false)} className="block px-4 py-3 text-sm font-medium rounded-xl transition-colors hover:bg-black/5 dark:hover:bg-white/5 text-foreground dark:text-white/80">{lang === 'tr' ? 'Satışlarım' : 'My Sales'}</Link>
              <Link href="/dashboard/new" onClick={() => setMenuOpen(false)} className="block px-4 py-3 text-sm font-bold text-center text-foreground dark:text-white rounded-xl hover:opacity-90 transition-opacity" style={{ background: 'var(--brand-orange)' }}>{t.nav.postAd}</Link>
              <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-sm font-medium text-red-400 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors">{t.nav.logout}</button>
            </>
          ) : (
            <>
              <Link href="/login" onClick={() => setMenuOpen(false)} className="block px-4 py-3 text-sm font-semibold text-center text-foreground dark:text-white border rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors" style={{ borderColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.12)' }}>{lang === 'tr' ? 'Giriş Yap' : 'Login'}</Link>
              <Link href="/register" onClick={() => setMenuOpen(false)} className="block px-4 py-3 text-sm font-semibold text-center rounded-xl hover:opacity-90 transition-opacity" style={{ background: isDark ? 'rgba(255,255,255,0.95)' : 'var(--brand-orange)', color: isDark ? '#111' : '#fff' }}>{lang === 'tr' ? 'Kayıt Ol' : 'Sign Up'}</Link>
                </>
          )}
        </div>
      )}
    </header>
    <div className="h-[104px] md:h-[112px]" />
    </>

  )
}