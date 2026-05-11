'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Plus, LayoutGrid, Eye, TrendingUp, Pencil, Trash2,
  AlertTriangle, MapPin, Clock, BarChart2, Package
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useLanguage } from '@/components/language-provider'
import { formatDistanceToNow } from 'date-fns'
import { tr, enUS } from 'date-fns/locale'

function StatCard({ icon: Icon, label, value, color, delay }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); observer.disconnect() } },
      { threshold: 0.1 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className="bg-card border border-border rounded-2xl p-6 flex items-center gap-4"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity 0.5s ease, transform 0.5s ease`,
        transitionDelay: delay,
      }}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-2xl font-extrabold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full mx-4 animate-scale-in shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle size={20} className="text-destructive" />
          </div>
          <h3 className="font-bold text-foreground">Emin misiniz?</h3>
        </div>
        <p className="text-muted-foreground text-sm mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors"
          >
            İptal
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-destructive text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Sil
          </button>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { t, lang } = useLanguage()
  const router = useRouter()
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const locale = lang === 'tr' ? tr : enUS

  const fetchListings = () => {
    setLoading(true)
    fetch('/api/my-listings')
      .then(r => r.json())
      .then(data => setListings(data.listings || []))
      .catch(() => setListings([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchListings() }, [])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/listings/${deleteTarget}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success(t.form.success.deleted)
      setListings(prev => prev.filter(l => l.id !== deleteTarget))
    } catch {
      toast.error(t.common.error)
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  const totalViews = listings.reduce((s, l) => s + (l.views || 0), 0)
  const activeCount = listings.filter(l => l.status === 'active').length

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
        <div>
          <p className="text-primary text-xs font-bold uppercase tracking-[0.18em] mb-1">{t.dashboard.title}</p>
          <h1 className="text-3xl font-extrabold text-foreground">
            {t.dashboard.welcome}, <span className="text-primary">{user?.name?.split(' ')[0]}</span>
          </h1>
        </div>
        <Link
          href="/dashboard/new"
          className="inline-flex items-center gap-2 px-5 py-3 bg-primary text-white font-bold rounded-xl hover:opacity-90 hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg shadow-primary/25 self-start sm:self-auto"
        >
          <Plus size={18} strokeWidth={2.5} />
          {t.dashboard.addListing}
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <StatCard
          icon={Package}
          label={t.dashboard.stats.total}
          value={listings.length}
          color="bg-primary/10 text-primary"
          delay="0ms"
        />
        <StatCard
          icon={BarChart2}
          label={t.dashboard.stats.active}
          value={activeCount}
          color="bg-emerald-500/10 text-emerald-500"
          delay="80ms"
        />
        <StatCard
          icon={Eye}
          label={t.dashboard.stats.views}
          value={totalViews.toLocaleString('tr-TR')}
          color="bg-blue-500/10 text-blue-400"
          delay="160ms"
        />
      </div>

      {/* Listings */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <LayoutGrid size={17} className="text-primary" />
            <h2 className="font-bold text-foreground">{t.dashboard.myListings}</h2>
            {listings.length > 0 && (
              <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded-full">
                {listings.length}
              </span>
            )}
          </div>
        </div>

        {loading ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4">
                <div className="w-16 h-16 rounded-xl bg-muted shimmer shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded-full shimmer w-2/3" />
                  <div className="h-3.5 bg-muted rounded-full shimmer w-1/3" />
                </div>
                <div className="h-8 w-20 bg-muted rounded-lg shimmer" />
              </div>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20 px-4">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Package size={28} className="text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">{t.dashboard.noListings}</h3>
            <p className="text-muted-foreground text-sm mb-6">{t.dashboard.noListingsDesc}</p>
            <Link
              href="/dashboard/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-semibold rounded-xl hover:opacity-90 transition-opacity text-sm"
            >
              <Plus size={16} />
              {t.dashboard.addListing}
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {listings.map((listing, i) => (
              <div
                key={listing.id}
                className="flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors group"
                style={{
                  animationDelay: `${i * 50}ms`,
                }}
              >
                {/* Thumbnail */}
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted shrink-0">
                  {listing.cover_image ? (
                    <img src={listing.cover_image} alt={listing.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl bg-muted">
                      <Package size={24} className="text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-sm truncate group-hover:text-primary transition-colors">
                    {listing.title}
                  </h3>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-primary font-bold text-sm">
                      {Number(listing.price).toLocaleString('tr-TR')} ₺
                    </span>
                    {listing.location && (
                      <span className="flex items-center gap-1 text-muted-foreground text-xs">
                        <MapPin size={11} />
                        {listing.location}
                      </span>
                    )}
                    {listing.created_at && (
                      <span className="flex items-center gap-1 text-muted-foreground text-xs">
                        <Clock size={11} />
                        {formatDistanceToNow(new Date(listing.created_at), { addSuffix: true, locale })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Status badge */}
                <span
                  className={`hidden sm:flex shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold ${
                    listing.status === 'active'
                      ? 'bg-emerald-500/10 text-emerald-500'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {listing.status === 'active' ? t.dashboard.status.active : t.dashboard.status.passive}
                </span>

                {/* Views */}
                <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground shrink-0 w-16 justify-end">
                  <Eye size={12} />
                  <span>{listing.views || 0}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => router.push(`/dashboard/${listing.id}/edit`)}
                    className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    aria-label="Edit"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(listing.id)}
                    className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    aria-label="Delete"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirm delete modal */}
      {deleteTarget && (
        <ConfirmModal
          message={t.dashboard.confirmDelete}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </main>
  )
}
