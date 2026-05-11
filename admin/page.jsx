'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/components/language-provider'
import { useTheme } from 'next-themes'
import {
  LayoutDashboard, Users, ListChecks, LogOut,
  Trash2, Eye, EyeOff, ShieldCheck, Package,
  TrendingUp, AlertTriangle, RefreshCw, ChevronDown,
  TicketPercent, Send, Bell, Truck,
  Sun, Moon, Languages,
  CheckCircle2, XCircle, Ban, MessageSquareWarning
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow
} from '@/components/ui/table'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

// ─── Login Screen ─────────────────────────────────────────────────
function AdminLogin({ onSuccess, lang }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [show, setShow] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        onSuccess()
      } else {
        const data = await res.json()
        setError(data.error === 'INVALID_PASSWORD' ? (lang === 'tr' ? 'Hatalı şifre.' : 'Wrong password.') : (lang === 'tr' ? 'Bir hata oluştu.' : 'Something went wrong.'))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-lg">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <ShieldCheck className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">{lang === 'tr' ? 'Admin Paneli' : 'Admin Panel'}</h1>
              <p className="text-xs text-muted-foreground">{lang === 'tr' ? 'Yönetici girişi' : 'Administrator login'}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="relative">
              <Input
                type={show ? 'text' : 'password'}
                placeholder={lang === 'tr' ? 'Admin şifresi' : 'Admin password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="pr-10"
                required
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShow(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (lang === 'tr' ? 'Giriş yapılıyor...' : 'Signing in...') : (lang === 'tr' ? 'Giriş Yap' : 'Sign in')}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color = 'bg-primary' }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 flex items-center gap-4">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${color}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value ?? '—'}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────
export default function AdminPage() {
  const router = useRouter()
  const { lang, toggleLang } = useLanguage()
  const { theme, setTheme } = useTheme()
  const trEn = (tr, en) => (lang === 'tr' ? tr : en)
  const orderStatusLabel = (status) => ({
    created: trEn('Oluşturuldu', 'Created'),
    paid: trEn('Ödendi', 'Paid'),
    shipped: trEn('Kargoya verildi', 'Shipped'),
    delivered: trEn('Teslim edildi', 'Delivered'),
    completed: trEn('Tamamlandı', 'Completed'),
    cancelled: trEn('İptal edildi', 'Cancelled'),
    cancel_requested: trEn('İptal talebi', 'Cancel requested'),
    return_requested: trEn('İade talebi', 'Return requested'),
    returned: trEn('İade edildi', 'Returned'),
  }[status] || status)
  const reportStatusLabel = (status) => ({
    open: trEn('Açık', 'Open'),
    reviewed: trEn('İncelendi', 'Reviewed'),
  }[status] || status)
  const listingStatusLabel = (status) => ({
    active: trEn('Yayında', 'Active'),
    pending: trEn('Onay bekliyor', 'Pending approval'),
    sold: trEn('Satıldı', 'Sold'),
    draft: trEn('Taslak', 'Draft'),
    rejected: trEn('Reddedildi', 'Rejected'),
    archived: trEn('Arşivlendi', 'Archived'),
    inactive: trEn('Pasif', 'Inactive'),
  }[status] || status)
  const [authed, setAuthed] = useState(false)
  const [tab, setTab] = useState('dashboard') // 'dashboard' | 'moderation' | 'listings' | 'users' | 'reports' | 'orders' | 'coupons' | 'broadcast'
  const [stats, setStats] = useState(null)
  const [dash, setDash] = useState(null)
  const [listings, setListings] = useState([])
  const [users, setUsers] = useState([])
  const [reports, setReports] = useState([])
  const [orders, setOrders] = useState([])
  const [coupons, setCoupons] = useState([])
  const [broadcasts, setBroadcasts] = useState([])
  const [loading, setLoading] = useState(false)

  // Coupons form
  const [couponForm, setCouponForm] = useState({
    code: '',
    type: 'percent',
    value: 10,
    min_subtotal: 0,
    is_public: false,
    max_uses: '',
    starts_at: '',
    expires_at: '',
    active: true,
  })
  const [assignForm, setAssignForm] = useState({ couponId: '', mode: 'email', email: '', userId: '', all: false })
  const [broadcastForm, setBroadcastForm] = useState({ title: '', message: '', link: '' })

  // Admin-only light theme + orange borders (requested)
  useEffect(() => {
    document.documentElement.classList.add('admin-theme')
    return () => document.documentElement.classList.remove('admin-theme')
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [statsRes, dashRes, listingsRes, usersRes, reportsRes, ordersRes, couponsRes, broadcastsRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/dashboard'),
        fetch('/api/admin/listings'),
        fetch('/api/admin/users'),
        fetch('/api/admin/reports'),
        fetch('/api/admin/orders'),
        fetch('/api/admin/coupons'),
        fetch('/api/admin/broadcasts'),
      ])

      if (
        statsRes.status === 403 ||
        listingsRes.status === 403 ||
        reportsRes.status === 403 ||
        ordersRes.status === 403 ||
        couponsRes.status === 403 ||
        broadcastsRes.status === 403
      ) {
        setAuthed(false)
        return
      }

      const [statsData, dashData, listingsData, usersData, reportsData, ordersData, couponsData, broadcastsData] = await Promise.all([
        statsRes.json(),
        dashRes.json(),
        listingsRes.json(),
        usersRes.json(),
        reportsRes.json(),
        ordersRes.json(),
        couponsRes.json(),
        broadcastsRes.json(),
      ])

      setStats(statsData.stats)
      setDash(dashData)
      setListings(listingsData.listings || [])
      setUsers(usersData.users || [])
      setReports(reportsData.reports || [])
      setOrders(ordersData.orders || [])
      setCoupons(couponsData.coupons || [])
      setBroadcasts(broadcastsData.broadcasts || [])
    } finally {
      setLoading(false)
    }
  }, [])

  const pendingListings = listings.filter(l => Number(l.is_approved) !== 1 && !['passive', 'rejected', 'inactive', 'archived'].includes(String(l.status || '').toLowerCase()))

  const spamWords = [
    'bedava', 'ücretsiz', 'acil', 'şok', 'telegram', 'whatsapp', 'tıklayın', 'link', 'iban', 'btc', 'kripto', 'garanti',
  ]

  const fallbackDashboard = {
    kpis: {
      today: {
        new_listings: listings.filter(l => l.created_at && new Date(l.created_at).toDateString() === new Date().toDateString()).length,
        sales: orders.filter(o => o.created_at && new Date(o.created_at).toDateString() === new Date().toDateString()).length,
        cancels: orders.filter(o => o.status === 'cancelled' && o.created_at && new Date(o.created_at).toDateString() === new Date().toDateString()).length,
        returns_count: orders.filter(o => o.status === 'returned' && o.created_at && new Date(o.created_at).toDateString() === new Date().toDateString()).length,
        active_users: new Set([
          ...listings.filter(l => l.created_at && new Date(l.created_at).toDateString() === new Date().toDateString()).map(l => l.user_id),
          ...orders.filter(o => o.created_at && new Date(o.created_at).toDateString() === new Date().toDateString()).flatMap(o => [o.buyer_user_id, o.seller_user_id]),
        ].filter(Boolean)).size,
      },
      week: {
        new_listings: listings.filter(l => l.created_at && (Date.now() - new Date(l.created_at).getTime()) <= 7 * 24 * 60 * 60 * 1000).length,
        sales: orders.filter(o => o.created_at && (Date.now() - new Date(o.created_at).getTime()) <= 7 * 24 * 60 * 60 * 1000).length,
        cancels: orders.filter(o => o.status === 'cancelled' && o.created_at && (Date.now() - new Date(o.created_at).getTime()) <= 7 * 24 * 60 * 60 * 1000).length,
        returns_count: orders.filter(o => o.status === 'returned' && o.created_at && (Date.now() - new Date(o.created_at).getTime()) <= 7 * 24 * 60 * 60 * 1000).length,
        active_users: new Set([
          ...listings.filter(l => l.created_at && (Date.now() - new Date(l.created_at).getTime()) <= 7 * 24 * 60 * 60 * 1000).map(l => l.user_id),
          ...orders.filter(o => o.created_at && (Date.now() - new Date(o.created_at).getTime()) <= 7 * 24 * 60 * 60 * 1000).flatMap(o => [o.buyer_user_id, o.seller_user_id]),
        ].filter(Boolean)).size,
      },
    },
    trends: {
      listings: Array.from({ length: 14 }, (_, idx) => {
        const start = new Date()
        start.setHours(0, 0, 0, 0)
        start.setDate(start.getDate() - (13 - idx))
        const end = new Date(start)
        end.setDate(end.getDate() + 1)
        return listings.filter(l => l.created_at && new Date(l.created_at) >= start && new Date(l.created_at) < end).length
      }),
      sales: Array.from({ length: 14 }, (_, idx) => {
        const start = new Date()
        start.setHours(0, 0, 0, 0)
        start.setDate(start.getDate() - (13 - idx))
        const end = new Date(start)
        end.setDate(end.getDate() + 1)
        return orders.filter(o => o.created_at && new Date(o.created_at) >= start && new Date(o.created_at) < end).length
      }),
    },
    activity: [
      ...orders.slice(0, 4).map(o => ({
        title: `${trEn('Sipariş', 'Order')} #${o.id}`,
        meta: `${o.buyer_name || trEn('Misafir', 'Guest')} • ${o.listing_title || ''}`,
        created_at: o.created_at,
        link: o.listing_id ? `/listings/${o.listing_id}` : '#',
      })),
      ...listings.slice(0, 4).map(l => ({
        title: trEn('Yeni ilan', 'New listing'),
        meta: l.title || '',
        created_at: l.created_at,
        link: `/listings/${l.id}`,
      })),
      ...reports.slice(0, 2).map(r => ({
        title: trEn('Şikayet', 'Report'),
        meta: `#${r.listing_id} • ${r.reason || ''}`.slice(0, 100),
        created_at: r.created_at,
        link: r.listing_id ? `/listings/${r.listing_id}` : '#',
      })),
    ].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).slice(0, 10),
  }
  const dashboardData = dash?.kpis ? dash : fallbackDashboard

  const suspiciousById = (() => {
    const map = new Map()
    const coverCounts = new Map()
    for (const l of pendingListings) {
      const key = (l.cover_image || '').trim()
      if (!key) continue
      coverCounts.set(key, (coverCounts.get(key) || 0) + 1)
    }
    for (const l of pendingListings) {
      const reasons = []
      const price = Number(l.price || 0)
      if (price > 0 && price < 50) reasons.push(trEn('Çok düşük fiyat', 'Very low price'))
      const coverKey = (l.cover_image || '').trim()
      if (coverKey && (coverCounts.get(coverKey) || 0) > 1) reasons.push(trEn('Aynı görsel tekrar', 'Duplicate image'))
      const text = `${l.title || ''} ${l.description || ''}`.toLowerCase()
      if (spamWords.some(w => text.includes(w))) reasons.push(trEn('Spam kelime', 'Spam keyword'))
      map.set(l.id, reasons)
    }
    return map
  })()

  function MiniBars({ values = [], height = 44 }) {
    const max = Math.max(1, ...(values.map(v => Number(v) || 0)))
    return (
      <div className="flex items-end gap-1" style={{ height }}>
        {values.map((v, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm bg-primary/25"
            style={{ height: `${Math.round(((Number(v) || 0) / max) * 100)}%` }}
            title={String(v)}
          />
        ))}
      </div>
    )
  }

  useEffect(() => {
    if (authed) fetchData()
  }, [authed, fetchData])

  async function handleLogout() {
    await fetch('/api/admin/login', { method: 'DELETE' })
    setAuthed(false)
  }

  async function handleListingStatus(id, status, extra = {}) {
    const payload = { status, ...extra }
    const res = await fetch(`/api/admin/listings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      return false
    }
    setListings(prev => prev.map(l => l.id === id ? { ...l, ...payload } : l))
    return true
  }

  async function handleListingApproval(id, is_approved) {
    const res = await fetch(`/api/admin/listings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_approved }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      if (data?.error === 'SCHEMA_MISSING_IS_APPROVED') {
        alert('DB şemasında is_approved kolonu yok. SQL ile eklemeniz gerekiyor.')
      }
      return false
    }
    setListings(prev => prev.map(l => l.id === id ? { ...l, is_approved } : l))
    // Keep reports tab in sync if the approved listing exists there
    setReports(prev => prev.map(r => r.listing_id === id ? { ...r, listing_is_approved: is_approved ? 1 : 0 } : r))
    return true
  }

  async function handleDeleteListing(id) {
    await fetch(`/api/admin/listings/${id}`, { method: 'DELETE' })
    setListings(prev => prev.filter(l => l.id !== id))
    if (stats) setStats(s => ({
      ...s,
      total_listings: s.total_listings - 1,
      active_listings: listings.find(l => l.id === id)?.status === 'active'
        ? s.active_listings - 1 : s.active_listings,
    }))
  }

  async function handleDeleteUser(id) {
    await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
    setUsers(prev => prev.filter(u => u.id !== id))
    setListings(prev => prev.filter(l => l.user_id !== id))
  }

  async function handleUserBlock(id, is_blocked, options = {}) {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_blocked, cascade_listings: !!options.cascadeListings }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      if (data?.error === 'SCHEMA_MISSING_IS_BLOCKED') {
        alert('DB şemasında is_blocked kolonu yok. SQL ile eklemeniz gerekiyor.')
      }
      return false
    }
    setUsers(prev => prev.map(u => u.id === id ? { ...u, is_blocked } : u))
    if (is_blocked && options.cascadeListings) {
      setListings(prev => prev.map(l => l.user_id === id ? { ...l, status: 'passive', is_approved: 0 } : l))
    }
    return true
  }

  async function handleUserWarn(id, message, link) {
    const res = await fetch(`/api/admin/users/${id}/warn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: trEn('Uyarı', 'Warning'),
        message: message || trEn('Lütfen ilan kurallarına uyun. Şüpheli içerikler kaldırılabilir.', 'Please follow listing rules. Suspicious content may be removed.'),
        link: link || null,
      }),
    })
    return res.ok
  }

  async function handleReportStatus(id, status) {
    await fetch(`/api/admin/reports/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r))
  }

  async function handleDeleteReport(id) {
    await fetch(`/api/admin/reports/${id}`, { method: 'DELETE' })
    setReports(prev => prev.filter(r => r.id !== id))
  }

  async function handleOrderStatus(id, status) {
    await fetch(`/api/admin/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
  }

  async function handleCreateCoupon() {
    const payload = {
      ...couponForm,
      code: String(couponForm.code || '').trim(),
      value: Number(couponForm.value) || 0,
      min_subtotal: Number(couponForm.min_subtotal) || 0,
      is_public: !!couponForm.is_public,
      active: !!couponForm.active,
      max_uses: couponForm.max_uses === '' ? null : Number(couponForm.max_uses),
      starts_at: couponForm.starts_at ? couponForm.starts_at : null,
      expires_at: couponForm.expires_at ? couponForm.expires_at : null,
    }
    const res = await fetch('/api/admin/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (res.ok) {
      const data = await res.json()
      setCoupons(prev => [data.coupon, ...prev])
      setCouponForm(f => ({ ...f, code: '' }))
    }
  }

  async function handleToggleCoupon(id, active) {
    await fetch(`/api/admin/coupons/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active }),
    })
    setCoupons(prev => prev.map(c => c.id === id ? { ...c, active } : c))
  }

  async function handleAssignCoupon() {
    const payload = {
      couponId: Number(assignForm.couponId),
      mode: assignForm.mode,
      email: assignForm.email,
      userId: assignForm.userId,
      all: !!assignForm.all,
    }
    const res = await fetch('/api/admin/coupons/assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (res.ok) {
      setAssignForm(f => ({ ...f, email: '', userId: '' }))
    }
  }

  async function handleBroadcast() {
    const payload = {
      title: String(broadcastForm.title || '').trim(),
      message: String(broadcastForm.message || '').trim(),
      link: String(broadcastForm.link || '').trim() || null,
    }
    const res = await fetch('/api/admin/broadcasts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (res.ok) {
      const data = await res.json()
      setBroadcasts(prev => [data.broadcast, ...prev])
      setBroadcastForm({ title: '', message: '', link: '' })
    }
  }

  if (!authed) {
    return <AdminLogin lang={lang} onSuccess={() => setAuthed(true)} />
  }

  return (
    <div className="min-h-screen bg-background" style={{ background: 'var(--background)' }}>
      {/* Top bar */}
      <header
        className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur"
        style={{ borderColor: 'color-mix(in oklab, var(--brand-orange) 22%, var(--border))' }}
      >
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <ShieldCheck className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-foreground">{lang === 'tr' ? 'Admin Paneli' : 'Admin Panel'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLang}
              className="gap-2 text-muted-foreground"
              aria-label={lang === 'tr' ? 'Dili değiştir' : 'Toggle language'}
            >
              <Languages className="h-4 w-4" />
              <span className="hidden sm:inline">{lang === 'tr' ? 'EN' : 'TR'}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="gap-2 text-muted-foreground"
              aria-label={lang === 'tr' ? 'Tema değiştir' : 'Toggle theme'}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              <span className="hidden sm:inline">{theme === 'dark' ? (lang === 'tr' ? 'Light' : 'Light') : (lang === 'tr' ? 'Dark' : 'Dark')}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={fetchData}
              disabled={loading}
              className="gap-2 text-muted-foreground"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{lang === 'tr' ? 'Yenile' : 'Refresh'}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="gap-2 text-muted-foreground hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">{lang === 'tr' ? 'Çıkış' : 'Logout'}</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-5">
          <StatCard label={lang === 'tr' ? 'Toplam Kullanıcı' : 'Total users'} value={stats?.total_users} icon={Users} color="bg-blue-500" />
          <StatCard label={lang === 'tr' ? 'Toplam İlan' : 'Total listings'} value={stats?.total_listings} icon={Package} color="bg-primary" />
          <StatCard label={lang === 'tr' ? 'Aktif İlan' : 'Active listings'} value={stats?.active_listings} icon={ListChecks} color="bg-green-500" />
          <StatCard label={lang === 'tr' ? 'Pasif İlan' : 'Passive listings'} value={stats?.passive_listings} icon={LayoutDashboard} color="bg-zinc-500" />
          <StatCard label={lang === 'tr' ? 'Toplam Görüntülenme' : 'Total views'} value={stats?.total_views?.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')} icon={TrendingUp} color="bg-amber-500" />
        </div>

        {/* Tabs */}
        <div
          className="mb-6 flex gap-1 rounded-xl border border-border bg-muted p-1 w-fit"
          style={{ borderColor: 'color-mix(in oklab, var(--brand-orange) 22%, var(--border))' }}
        >
          {[
            { id: 'dashboard', label: lang === 'tr' ? 'Dashboard' : 'Dashboard', icon: LayoutDashboard },
            { id: 'moderation', label: lang === 'tr' ? 'Moderasyon' : 'Moderation', icon: ShieldCheck },
            { id: 'listings', label: lang === 'tr' ? 'İlanlar' : 'Listings', icon: ListChecks },
            { id: 'users', label: lang === 'tr' ? 'Kullanıcılar' : 'Users', icon: Users },
            { id: 'reports', label: lang === 'tr' ? 'Bildirilenler' : 'Reports', icon: AlertTriangle },
            { id: 'orders', label: lang === 'tr' ? 'Siparişler' : 'Orders', icon: Package },
            { id: 'coupons', label: lang === 'tr' ? 'Kuponlar' : 'Coupons', icon: TicketPercent },
            { id: 'broadcast', label: lang === 'tr' ? 'Kampanya' : 'Broadcast', icon: Bell },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                tab === id
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Dashboard — "durum ekranı" */}
        {tab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <h2 className="font-semibold text-foreground">{trEn('Bugün / Bu hafta', 'Today / This week')}</h2>
                    <p className="text-xs text-muted-foreground">{trEn('Canlı durum metrikleri', 'Live status metrics')}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {pendingListings.length} {trEn('bekleyen ilan', 'pending listings')}
                  </Badge>
                </div>

                <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3">
                  {[
                    { k: 'new_listings', label: trEn('Yeni ilan', 'New listings') },
                    { k: 'sales', label: trEn('Satış', 'Sales') },
                    { k: 'cancels', label: trEn('İptal', 'Cancels') },
                    { k: 'returns_count', label: trEn('İade', 'Returns') },
                    { k: 'active_users', label: trEn('Aktif kullanıcı', 'Active users') },
                  ].map(({ k, label }) => (
                    <div key={k} className="rounded-xl border border-border bg-background p-4">
                      <div className="text-xs text-muted-foreground">{label}</div>
                      <div className="mt-1 text-2xl font-extrabold text-foreground">
                        {dashboardData?.kpis?.today?.[k] ?? '—'}
                      </div>
                      <div className="mt-1 text-[11px] text-muted-foreground">
                        {trEn('Hafta:', 'Week:')} {dashboardData?.kpis?.week?.[k] ?? '—'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground">{trEn('Günlük ilan trendi', 'Daily listing trend')}</h3>
                    <span className="text-xs text-muted-foreground">{trEn('Son 14 gün', 'Last 14 days')}</span>
                  </div>
                  <div className="mt-3">
                    <MiniBars values={dashboardData?.trends?.listings || []} />
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground">{trEn('Günlük satış trendi', 'Daily sales trend')}</h3>
                    <span className="text-xs text-muted-foreground">{trEn('Son 14 gün', 'Last 14 days')}</span>
                  </div>
                  <div className="mt-3">
                    <MiniBars values={dashboardData?.trends?.sales || []} />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h2 className="font-semibold text-foreground">{trEn('Son 10 işlem', 'Last 10 actions')}</h2>
                <p className="text-xs text-muted-foreground">{trEn('Sipariş • İlan • Şikayet', 'Orders • Listings • Reports')}</p>
              </div>
              <div className="divide-y divide-border">
                {(dashboardData?.activity || []).length === 0 ? (
                  <div className="px-5 py-10 text-sm text-muted-foreground text-center">{trEn('Henüz işlem yok.', 'No activity yet.')}</div>
                ) : (dashboardData?.activity || []).map((a, idx) => (
                  <a
                    key={idx}
                    href={a.link || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="block px-5 py-3 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium text-foreground">{a.title}</div>
                        <div className="text-xs text-muted-foreground line-clamp-1">{a.meta}</div>
                      </div>
                      <div className="text-[11px] text-muted-foreground shrink-0">
                        {a.created_at ? new Date(a.created_at).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US') : ''}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Moderation (most critical) */}
        {tab === 'moderation' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-5 flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="font-semibold text-foreground">{trEn('İlan onay / red kuyruğu', 'Listing approval / rejection queue')}</h2>
                <p className="text-xs text-muted-foreground">{trEn('Foto + başlık + fiyat + kategori ile hızlı inceleme', 'Fast review with photo + title + price + category')}</p>
              </div>
              <Badge variant="secondary">{pendingListings.length} {trEn('bekliyor', 'pending')}</Badge>
            </div>

            {pendingListings.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
                {trEn('Onay bekleyen ilan yok.', 'No listings waiting for approval.')}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {pendingListings.map((l) => {
                  const reasons = suspiciousById.get(l.id) || []
                  const link = `/listings/${l.id}`
                  return (
                    <div key={l.id} className="rounded-2xl border border-border bg-card overflow-hidden">
                      <div className="aspect-[16/9] bg-muted">
                        {l.cover_image ? (
                          <img src={l.cover_image} alt={l.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">—</div>
                        )}
                      </div>

                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <a href={link} target="_blank" rel="noreferrer" className="font-semibold text-foreground hover:text-primary line-clamp-2">
                            {l.title}
                          </a>
                          <Badge variant="secondary" className="shrink-0">#{l.id}</Badge>
                        </div>

                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-primary">{Number(l.price || 0).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')} ₺</span>
                          <span className="text-xs text-muted-foreground capitalize">{l.category}</span>
                          {l.location ? <span className="text-xs text-muted-foreground">• {l.location}</span> : null}
                        </div>

                        {reasons.length > 0 && (
                          <div className="mt-3 rounded-xl border border-amber-500/25 bg-amber-500/10 p-3">
                            <div className="flex items-center gap-2 text-amber-700 text-xs font-semibold">
                              <AlertTriangle className="h-4 w-4" /> {trEn('Şüpheli ilan', 'Suspicious listing')}
                            </div>
                            <ul className="mt-2 text-xs text-amber-800/90 list-disc pl-4 space-y-1">
                              {reasons.map((r, i) => <li key={i}>{r}</li>)}
                            </ul>
                          </div>
                        )}

                        <div className="mt-4 grid grid-cols-2 gap-2">
                          <Button
                            className="gap-2"
                            onClick={async () => {
                              const okApprove = await handleListingApproval(l.id, true)
                              const okStatus = await handleListingStatus(l.id, 'active')
                              if (!okApprove || !okStatus) alert(trEn('İlan onaylanamadı.', 'Could not approve listing.'))
                            }}
                          >
                            <CheckCircle2 className="h-4 w-4" /> {trEn('Onayla', 'Approve')}
                          </Button>

                          <Button
                            variant="secondary"
                            className="gap-2"
                            onClick={async () => {
                              const okApprove = await handleListingApproval(l.id, false)
                              const okStatus = await handleListingStatus(l.id, 'passive', { is_approved: false })
                              if (!okApprove || !okStatus) alert(trEn('İlan reddedilemedi.', 'Could not reject listing.'))
                            }}
                          >
                            <XCircle className="h-4 w-4" /> {trEn('Reddet', 'Reject')}
                          </Button>
                        </div>

                        <div className="mt-2 grid grid-cols-2 gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-2 justify-start"
                            onClick={async () => {
                              const ok = await handleUserWarn(l.user_id, trEn('İlanınız incelemede. Lütfen kurallara uygun içerik sağlayın.', 'Your listing is under review. Please make sure it follows the rules.'), link)
                              if (!ok) alert(trEn('Uyarı gönderilemedi.', 'Could not send warning.'))
                            }}
                          >
                            <MessageSquareWarning className="h-4 w-4" /> {trEn('Uyar', 'Warn')}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-2 justify-start text-destructive hover:text-destructive"
                            onClick={async () => {
                              const ok = await handleUserBlock(l.user_id, true, { cascadeListings: true })
                              if (!ok) alert(trEn('Kullanıcı banlanamadı.', 'Could not ban user.'))
                            }}
                          >
                            <Ban className="h-4 w-4" /> {trEn('Banla', 'Ban')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Listings Table */}
        {tab === 'listings' && (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold text-foreground">{trEn('Tüm İlanlar', 'All Listings')}</h2>
              <span className="text-sm text-muted-foreground">{listings.length} {trEn('ilan', 'listings')}</span>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{trEn('Başlık', 'Title')}</TableHead>
                    <TableHead>{trEn('Satıcı', 'Seller')}</TableHead>
                    <TableHead>{trEn('Kategori', 'Category')}</TableHead>
                    <TableHead>{trEn('Fiyat', 'Price')}</TableHead>
                    <TableHead>{trEn('Görüntülenme', 'Views')}</TableHead>
                    <TableHead>{trEn('Onay', 'Approval')}</TableHead>
                    <TableHead>{trEn('Durum', 'Status')}</TableHead>
                    <TableHead>{trEn('Tarih', 'Date')}</TableHead>
                    <TableHead className="text-right">{trEn('İşlem', 'Actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground py-12">
                        {trEn('Hiç ilan bulunamadı.', 'No listings found.')}
                      </TableCell>
                    </TableRow>
                  ) : listings.map(listing => (
                    <TableRow key={listing.id}>
                      <TableCell className="max-w-[200px]">
                        <a
                          href={`/listings/${listing.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-foreground hover:text-primary transition-colors line-clamp-1"
                        >
                          {listing.title}
                        </a>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm text-foreground">{listing.seller_name}</p>
                          <p className="text-xs text-muted-foreground">{listing.seller_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm capitalize text-muted-foreground">{listing.category}</span>
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {Number(listing.price).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')} ₺
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {(listing.views || 0).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={Number(listing.is_approved) === 1 ? 'default' : 'secondary'}
                          className={Number(listing.is_approved) === 1
                            ? 'bg-blue-500/15 text-blue-600 border-blue-500/20 hover:bg-blue-500/20'
                            : 'bg-amber-500/15 text-amber-700 border-amber-500/20'}
                        >
                          {Number(listing.is_approved) === 1 ? trEn('Onaylı', 'Approved') : trEn('Bekliyor', 'Pending')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={listing.status === 'active' ? 'default' : 'secondary'}
                          className={listing.status === 'active'
                            ? 'bg-green-500/15 text-green-600 border-green-500/20 hover:bg-green-500/20'
                            : 'bg-zinc-500/15 text-zinc-500 border-zinc-500/20'
                          }
                        >
                          {listing.status === 'active' ? trEn('Aktif', 'Active') : trEn('Pasif', 'Passive')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(listing.created_at).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs"
                            onClick={() => handleListingApproval(listing.id, Number(listing.is_approved) === 1 ? false : true)}
                          >
                            {Number(listing.is_approved) === 1 ? trEn('Onayı kaldır', 'Remove approval') : trEn('Onayla', 'Approve')}
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 px-2 gap-1 text-xs">
                                {trEn('Durum', 'Status')} <ChevronDown className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleListingStatus(listing.id, 'active')}
                                disabled={listing.status === 'active'}
                              >
                                {trEn('Aktif yap', 'Set active')}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleListingStatus(listing.id, 'passive')}
                                disabled={listing.status === 'passive'}
                              >
                                {trEn('Pasif yap', 'Set passive')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{trEn('İlanı sil', 'Delete listing')}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  <strong>"{listing.title}"</strong> {trEn('ilanını kalıcı olarak silmek istediğinizden emin misiniz?', 'Are you sure you want to permanently delete this listing?')}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{trEn('İptal', 'Cancel')}</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteListing(listing.id)}
                                  className="bg-destructive hover:bg-destructive/90"
                                >
                                  {trEn('Sil', 'Delete')}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Orders */}
        {tab === 'orders' && (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold text-foreground">{trEn('Siparişler','Orders')}</h2>
              <span className="text-sm text-muted-foreground">{orders.length} {trEn('sipariş','orders')}</span>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>{trEn('Ürün','Product')}</TableHead>
                    <TableHead>{trEn('Alıcı','Buyer')}</TableHead>
                    <TableHead>{trEn('Toplam','Total')}</TableHead>
                    <TableHead>{trEn('Kupon','Coupon')}</TableHead>
                    <TableHead>{trEn('Durum','Status')}</TableHead>
                    <TableHead>{trEn('Tarih','Date')}</TableHead>
                    <TableHead className="text-right">{trEn('İşlem','Action')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground py-12">
                        {trEn('Hiç sipariş yok.','No orders yet.')}
                      </TableCell>
                    </TableRow>
                  ) : orders.map(o => (
                    <TableRow key={o.id}>
                      <TableCell className="font-mono text-xs">#{o.id}</TableCell>
                      <TableCell className="max-w-[240px]">
                        <a className="hover:text-primary line-clamp-1" href={`/listings/${o.listing_id}`} target="_blank" rel="noreferrer">{o.listing_title}</a>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm text-foreground">{o.buyer_name || trEn('Misafir', 'Guest')}</p>
                          <p className="text-xs text-muted-foreground">{o.buyer_email || ''}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-medium">{Number(o.total_price || 0).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')} ₺</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{o.coupon_code ? `${o.coupon_code} (-${Number(o.discount_amount || 0).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')}₺)` : '—'}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{orderStatusLabel(o.status)}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{new Date(o.created_at).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 px-2 gap-1 text-xs">
                              {trEn('Durum', 'Status')} <ChevronDown className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {['created','paid','shipped','cancelled'].map(s => (
                              <DropdownMenuItem key={s} onClick={() => handleOrderStatus(o.id, s)} disabled={o.status === s} className="capitalize">
                                {s === 'shipped' ? <span className="flex items-center gap-2"><Truck className="h-4 w-4" /> {orderStatusLabel(s)}</span> : orderStatusLabel(s)}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Coupons */}
        {tab === 'coupons' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-1 rounded-xl border border-border bg-card p-5">
              <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2"><TicketPercent className="h-4 w-4" /> {trEn('Kupon Oluştur', 'Create Coupon')}</h2>
              <div className="flex flex-col gap-3">
                <Input placeholder={trEn('KOD (örn. HOSGELDIN10)', 'CODE (e.g. WELCOME10)')} value={couponForm.code} onChange={e => setCouponForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} />
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <select
                      className="select-clean h-10 w-full rounded-md border border-input bg-background px-3 pr-9 text-sm"
                      value={couponForm.type}
                      onChange={e => setCouponForm(f => ({ ...f, type: e.target.value }))}
                    >
                      <option value="percent">{trEn('Yüzde', 'Percent')}</option>
                      <option value="fixed">{trEn('Sabit', 'Fixed')}</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                  <Input type="number" placeholder={trEn('Değer', 'Value')} value={couponForm.value} onChange={e => setCouponForm(f => ({ ...f, value: e.target.value }))} />
                </div>
                <Input type="number" placeholder={trEn('Minimum sepet (₺)', 'Min subtotal (₺)')} value={couponForm.min_subtotal} onChange={e => setCouponForm(f => ({ ...f, min_subtotal: e.target.value }))} />
                <Input type="number" placeholder={trEn('Max kullanım (opsiyonel)', 'Max uses (optional)')} value={couponForm.max_uses} onChange={e => setCouponForm(f => ({ ...f, max_uses: e.target.value }))} />
                <div className="grid grid-cols-2 gap-2">
                  <Input type="datetime-local" value={couponForm.starts_at} onChange={e => setCouponForm(f => ({ ...f, starts_at: e.target.value }))} />
                  <Input type="datetime-local" value={couponForm.expires_at} onChange={e => setCouponForm(f => ({ ...f, expires_at: e.target.value }))} />
                </div>
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input type="checkbox" checked={couponForm.is_public} onChange={e => setCouponForm(f => ({ ...f, is_public: e.target.checked }))} />
                  {trEn('Herkese açık (public)', 'Public (everyone)')}
                </label>
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input type="checkbox" checked={couponForm.active} onChange={e => setCouponForm(f => ({ ...f, active: e.target.checked }))} />
                  {trEn('Aktif', 'Active')}
                </label>
                <Button onClick={handleCreateCoupon} className="gap-2"><TicketPercent className="h-4 w-4" /> {trEn('Oluştur', 'Create')}</Button>
              </div>
            </div>

            <div className="lg:col-span-2 rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <h2 className="font-semibold text-foreground">{trEn('Kuponlar', 'Coupons')}</h2>
                <span className="text-sm text-muted-foreground">{coupons.length} {trEn('kupon', 'coupons')}</span>
              </div>
              <div className="px-5 py-4 border-b border-border">
                <h3 className="text-sm font-medium text-foreground mb-2">{trEn('Kupon dağıt', 'Assign coupon')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                  <div className="relative">
                    <select
                      className="select-clean h-10 w-full rounded-md border border-input bg-background px-3 pr-9 text-sm"
                      value={assignForm.couponId}
                      onChange={e => setAssignForm(f => ({ ...f, couponId: e.target.value }))}
                    >
                      <option value="">{trEn('Kupon seç', 'Select coupon')}</option>
                      {coupons.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="relative">
                    <select
                      className="select-clean h-10 w-full rounded-md border border-input bg-background px-3 pr-9 text-sm"
                      value={assignForm.mode}
                      onChange={e => setAssignForm(f => ({ ...f, mode: e.target.value }))}
                    >
                      <option value="email">Email</option>
                      <option value="userId">User ID</option>
                      <option value="all">{trEn('Tüm kullanıcılar', 'All users')}</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                  {assignForm.mode === 'email' && (
                    <Input placeholder="kullanici@email.com" value={assignForm.email} onChange={e => setAssignForm(f => ({ ...f, email: e.target.value }))} />
                  )}
                  {assignForm.mode === 'userId' && (
                    <Input placeholder="User ID" value={assignForm.userId} onChange={e => setAssignForm(f => ({ ...f, userId: e.target.value }))} />
                  )}
                  {assignForm.mode === 'all' && (
                    <div className="text-sm text-muted-foreground flex items-center">{trEn('Tüm kullanıcılara atanır', 'Will be assigned to all users')}</div>
                  )}
                  <Button onClick={handleAssignCoupon} className="gap-2 md:col-span-1"><Send className="h-4 w-4" /> {trEn('Dağıt', 'Assign')}</Button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{trEn('Kod','Code')}</TableHead>
                      <TableHead>{trEn('Tip','Type')}</TableHead>
                      <TableHead>{trEn('Değer','Value')}</TableHead>
                      <TableHead>{trEn('Min','Min')}</TableHead>
                      <TableHead>{trEn('Public','Public')}</TableHead>
                      <TableHead>{trEn('Kullanım','Usage')}</TableHead>
                      <TableHead>{trEn('Aktif','Active')}</TableHead>
                      <TableHead className="text-right">{trEn('İşlem','Action')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {coupons.length === 0 ? (
                      <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-12">{trEn('Kupon yok.', 'No coupons.')}</TableCell></TableRow>
                    ) : coupons.map(c => (
                      <TableRow key={c.id}>
                        <TableCell className="font-mono text-xs">{c.code}</TableCell>
                        <TableCell className="text-sm capitalize">{c.type}</TableCell>
                        <TableCell className="text-sm">{c.type === 'percent' ? `%${c.value}` : `${Number(c.value).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')} ₺`}</TableCell>
                        <TableCell className="text-sm">{Number(c.min_subtotal || 0).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')} ₺</TableCell>
                        <TableCell className="text-sm">{c.is_public ? trEn('Evet','Yes') : trEn('Hayır','No')}</TableCell>
                        <TableCell className="text-sm">{c.used_count}{c.max_uses ? ` / ${c.max_uses}` : ''}</TableCell>
                        <TableCell className="text-sm">{c.active ? trEn('Evet','Yes') : trEn('Hayır','No')}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => handleToggleCoupon(c.id, c.active ? 0 : 1)}>
                            {c.active ? trEn('Pasifle','Deactivate') : trEn('Aktifle','Activate')}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}

        {/* Broadcast */}
        {tab === 'broadcast' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-1 rounded-xl border border-border bg-card p-5">
              <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2"><Bell className="h-4 w-4" /> {trEn('Kampanya bildirimi gönder','Send campaign notification')}</h2>
              <div className="flex flex-col gap-3">
                <Input placeholder={trEn('Başlık','Title')} value={broadcastForm.title} onChange={e => setBroadcastForm(f => ({ ...f, title: e.target.value }))} />
                <Input placeholder={trEn('Mesaj','Message')} value={broadcastForm.message} onChange={e => setBroadcastForm(f => ({ ...f, message: e.target.value }))} />
                <Input placeholder={trEn('Link (opsiyonel)','Link (optional)')} value={broadcastForm.link} onChange={e => setBroadcastForm(f => ({ ...f, link: e.target.value }))} />
                <Button onClick={handleBroadcast} className="gap-2"><Send className="h-4 w-4" /> {trEn('Gönder','Send')}</Button>
                <p className="text-xs text-muted-foreground">{trEn('Bu bildirim tüm kullanıcılara "campaign" tipiyle iletilir.','This notification is delivered to all users as type "campaign".')}</p>
              </div>
            </div>
            <div className="lg:col-span-2 rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <h2 className="font-semibold text-foreground">{trEn('Son kampanyalar','Recent campaigns')}</h2>
                <span className="text-sm text-muted-foreground">{broadcasts.length}</span>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{trEn('Başlık','Title')}</TableHead>
                      <TableHead>{trEn('Mesaj','Message')}</TableHead>
                      <TableHead>{trEn('Link','Link')}</TableHead>
                      <TableHead>{trEn('Tarih','Date')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {broadcasts.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-12">{trEn('Henüz kampanya yok.','No campaigns yet.')}</TableCell></TableRow>
                    ) : broadcasts.map(b => (
                      <TableRow key={b.id}>
                        <TableCell className="font-medium">{b.title}</TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[360px] line-clamp-2">{b.message}</TableCell>
                        <TableCell className="text-sm">{b.link ? <a className="text-primary hover:underline" href={b.link} target="_blank" rel="noreferrer">link</a> : '—'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{new Date(b.created_at).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}

        {/* Users Table */}
        {tab === 'users' && (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold text-foreground">{trEn('Tüm Kullanıcılar','All Users')}</h2>
              <span className="text-sm text-muted-foreground">{users.length} {trEn('kullanıcı','users')}</span>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{trEn('Ad Soyad','Name')}</TableHead>
                    <TableHead>{trEn('E-posta','Email')}</TableHead>
                    <TableHead>{trEn('Telefon','Phone')}</TableHead>
                    <TableHead>{trEn('İlan Sayısı','Listings')}</TableHead>
                    <TableHead>{trEn('Kayıt Tarihi','Registered')}</TableHead>
                    <TableHead>{trEn('Durum','Status')}</TableHead>
                    <TableHead className="text-right">{trEn('İşlem','Action')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                        {trEn('Hiç kullanıcı bulunamadı.','No users found.')}
                      </TableCell>
                    </TableRow>
                  ) : users.map(user => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium text-foreground">{user.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{user.phone || '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{user.listing_count}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US')}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={user.is_blocked ? 'destructive' : 'secondary'}
                          className={user.is_blocked ? 'bg-destructive/15 text-destructive border-destructive/20' : 'bg-green-500/15 text-green-600 border-green-500/20'}
                        >
                          {user.is_blocked ? trEn('Engelli','Blocked') : trEn('Aktif','Active')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => handleUserBlock(user.id, !user.is_blocked)}
                          >
                            {user.is_blocked ? trEn('Engeli kaldır','Unblock') : trEn('Engelle','Block')}
                          </Button>

                          <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{trEn('Kullanıcıyı sil','Delete user')}</AlertDialogTitle>
                              <AlertDialogDescription>
                                <strong>{user.name}</strong> kullanıcısını ve tüm ilanlarını ({user.listing_count} ilan) kalıcı olarak silmek istediğinizden emin misiniz?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{trEn('İptal','Cancel')}</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteUser(user.id)}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                Sil
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Reports Table */}
        {tab === 'reports' && (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold text-foreground">{trEn('Bildirilen İlanlar','Reported Listings')}</h2>
              <span className="text-sm text-muted-foreground">{reports.length} {trEn('bildirim','reports')}</span>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{trEn('İlan','Listing')}</TableHead>
                    <TableHead>{trEn('Gerekçe','Reason')}</TableHead>
                    <TableHead>{trEn('Bildiren','Reporter')}</TableHead>
                    <TableHead>{trEn('Durum','Status')}</TableHead>
                    <TableHead>{trEn('Tarih','Date')}</TableHead>
                    <TableHead className="text-right">{trEn('İşlem','Action')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                        {trEn('Hiç bildirim bulunamadı.','No reports found.')}
                      </TableCell>
                    </TableRow>
                  ) : reports.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="max-w-[220px]">
                        <a
                          href={`/listings/${r.listing_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-foreground hover:text-primary transition-colors line-clamp-1"
                        >
                          {r.listing_title || `#${r.listing_id}`}
                        </a>
                        <div className="text-xs text-muted-foreground">{trEn('İlan durumu: ', 'Listing status: ')}{listingStatusLabel(r.listing_status)}</div>
                      </TableCell>
                      <TableCell className="max-w-[320px]">
                        <div className="text-sm text-foreground line-clamp-2">{r.reason}</div>
                      </TableCell>
                      <TableCell>
                        {r.reporter_user_id ? (
                          <div>
                            <p className="text-sm text-foreground">{r.reporter_name || '—'}</p>
                            <p className="text-xs text-muted-foreground">{r.reporter_email || '—'}</p>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">{trEn('Misafir','Guest')}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={r.status === 'open' ? 'default' : 'secondary'}
                          className={r.status === 'open'
                            ? 'bg-amber-500/15 text-amber-700 border-amber-500/20 hover:bg-amber-500/20'
                            : 'bg-green-500/15 text-green-600 border-green-500/20 hover:bg-green-500/20'
                          }
                        >
                          {reportStatusLabel(r.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(r.created_at).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs"
                            onClick={() => handleListingApproval(
                              r.listing_id,
                              Number(r.listing_is_approved) === 1 ? false : true
                            )}
                          >
                            {Number(r.listing_is_approved) === 1 ? trEn('Onayı kaldır', 'Remove approval') : trEn('Onayla', 'Approve')}
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 px-2 gap-1 text-xs">
                                {trEn('Durum', 'Status')} <ChevronDown className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleReportStatus(r.id, 'open')}
                                disabled={r.status === 'open'}
                              >
                                {reportStatusLabel('open')}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleReportStatus(r.id, 'reviewed')}
                                disabled={r.status === 'reviewed'}
                              >
                                {reportStatusLabel('reviewed')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{trEn('Bildirimi sil', 'Delete report')}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {trEn('Bu bildirimi kalıcı olarak silmek istediğinizden emin misiniz?', 'Are you sure you want to permanently delete this report?')}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{trEn('İptal','Cancel')}</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteReport(r.id)}
                                  className="bg-destructive hover:bg-destructive/90"
                                >
                                  {trEn('Sil', 'Delete')}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
