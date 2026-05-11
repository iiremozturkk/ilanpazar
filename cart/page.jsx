'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Trash2, Minus, Plus } from 'lucide-react'
import Navbar from '@/components/navbar'
import Footer from '@/components/footer'
import { useCart } from '@/components/cart-provider'
import { useLanguage } from '@/components/language-provider'

export default function CartPage() {
  const { t, lang } = useLanguage()
  const router = useRouter()
  const { items, subtotal, setQuantity, removeItem, clear, syncStock, hydrated } = useCart()
  const [syncing, setSyncing] = useState(false)

  const formattedSubtotal = useMemo(() =>
    new Intl.NumberFormat(lang === 'tr' ? 'tr-TR' : 'en-US', { style: 'currency', currency: 'TRY' }).format(subtotal || 0),
  [subtotal, lang])

  useEffect(() => {
    if (!hydrated || items.length === 0) return
    let cancelled = false
    ;(async () => {
      setSyncing(true)
      try {
        await Promise.all(items.map(async (it) => {
          const res = await fetch(`/api/listings/${it.listingId}`, { cache: 'no-store' })
          if (!res.ok) return
          const data = await res.json()
          const stock = data?.listing?.stock
          if (!cancelled && typeof stock !== 'undefined') syncStock(it.listingId, stock)
        }))
      } finally {
        if (!cancelled) setSyncing(false)
      }
    })()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated])

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-foreground">{lang === 'tr' ? 'Sepet' : 'Cart'}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {syncing ? (lang === 'tr' ? 'Stoklar güncelleniyor…' : 'Syncing stock…') : (lang === 'tr' ? 'Ürünlerini kontrol et ve ödeme adımına geç.' : 'Review your items and proceed to checkout.')}
            </p>
          </div>
          {items.length > 0 && (
            <button
              onClick={clear}
              className="text-sm font-semibold text-destructive hover:opacity-80"
            >
              {lang === 'tr' ? 'Sepeti boşalt' : 'Clear cart'}
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-10 text-center">
            <div className="text-6xl mb-3">🛒</div>
            <p className="text-foreground font-semibold">{lang === 'tr' ? 'Sepetin boş.' : 'Your cart is empty.'}</p>
            <Link
              href="/listings"
              className="inline-flex mt-5 px-6 py-3 rounded-xl font-bold text-white"
              style={{ background: 'var(--brand-orange)' }}
            >
              {lang === 'tr' ? 'İlanlara göz at' : 'Browse listings'}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {items.map((it) => {
                const outOfStock = typeof it.stock === 'number' && it.stock <= 0
                const maxed = typeof it.stock === 'number' && it.quantity >= it.stock && it.stock > 0
                return (
                  <div key={it.listingId} className="bg-card rounded-2xl border border-border p-4 flex gap-4">
                    <Link href={`/listings/${it.listingId}`} className="shrink-0 w-24 h-24 rounded-xl overflow-hidden bg-muted border border-border">
                      {it.cover_image ? (
                        <img src={it.cover_image} alt={it.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl">📦</div>
                      )}
                    </Link>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link href={`/listings/${it.listingId}`} className="font-bold text-foreground hover:underline line-clamp-1">
                            {it.title}
                          </Link>
                          <div className="text-sm text-muted-foreground mt-1">
                            {new Intl.NumberFormat(lang === 'tr' ? 'tr-TR' : 'en-US', { style: 'currency', currency: 'TRY' }).format(Number(it.price) || 0)}
                            {typeof it.stock === 'number' && (
                              <span className="ml-2">• {lang === 'tr' ? 'Stok:' : 'Stock:'} {it.stock}</span>
                            )}
                          </div>
                          {outOfStock && (
                            <div className="text-xs text-destructive mt-1">{lang === 'tr' ? 'Stok yok — satın alınamaz.' : 'Out of stock — cannot purchase.'}</div>
                          )}
                        </div>
                        <button
                          onClick={() => removeItem(it.listingId)}
                          className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground"
                          aria-label={lang === 'tr' ? 'Kaldır' : 'Remove'}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setQuantity(it.listingId, (it.quantity || 1) - 1)}
                            className="w-9 h-9 rounded-xl border border-border flex items-center justify-center hover:bg-muted/40"
                            disabled={(it.quantity || 1) <= 1}
                          >
                            <Minus size={16} />
                          </button>
                          <input
                            value={it.quantity || 1}
                            onChange={(e) => setQuantity(it.listingId, e.target.value)}
                            className="w-14 text-center px-2 py-2 rounded-xl border border-border bg-background text-foreground"
                          />
                          <button
                            onClick={() => setQuantity(it.listingId, (it.quantity || 1) + 1)}
                            className="w-9 h-9 rounded-xl border border-border flex items-center justify-center hover:bg-muted/40"
                            disabled={outOfStock || maxed}
                            title={maxed ? (lang === 'tr' ? 'Stok limiti' : 'Stock limit') : ''}
                          >
                            <Plus size={16} />
                          </button>
                        </div>

                        <div className="font-extrabold text-foreground">
                          {new Intl.NumberFormat(lang === 'tr' ? 'tr-TR' : 'en-US', { style: 'currency', currency: 'TRY' }).format((Number(it.price) || 0) * (it.quantity || 0))}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <aside className="bg-card rounded-2xl border border-border p-6 h-fit">
              <h2 className="text-lg font-bold text-foreground mb-4">{lang === 'tr' ? 'Sipariş Özeti' : 'Order Summary'}</h2>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{lang === 'tr' ? 'Ara Toplam' : 'Subtotal'}</span>
                <span>{formattedSubtotal}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground mt-2">
                <span>{lang === 'tr' ? 'Kargo' : 'Shipping'}</span>
                <span>{lang === 'tr' ? 'Ödemede hesaplanır' : 'Calculated at checkout'}</span>
              </div>
              <div className="h-px bg-border my-4" />
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">{lang === 'tr' ? 'Toplam' : 'Total'}</span>
                <span className="text-xl font-extrabold text-foreground">{formattedSubtotal}</span>
              </div>

              <button
                onClick={() => router.push('/checkout')}
                className="mt-5 w-full px-5 py-3 rounded-xl font-extrabold text-white hover:opacity-95"
                style={{ background: 'var(--brand-orange)' }}
              >
                {lang === 'tr' ? 'Satın Almaya Devam Et' : 'Proceed to Checkout'}
              </button>
              <Link
                href="/listings"
                className="mt-3 block w-full text-center px-5 py-3 rounded-xl font-semibold border border-border hover:bg-muted/30"
              >
                {lang === 'tr' ? 'Alışverişe devam et' : 'Continue shopping'}
              </Link>
              <p className="mt-4 text-xs text-muted-foreground">
                {lang === 'tr'
                  ? 'Not: Bu demo ödeme sayfası gerçek kart işlemi yapmaz.'
                  : 'Note: This demo checkout does not process real card payments.'}
              </p>
            </aside>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
