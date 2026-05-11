'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import Navbar from '@/components/navbar'
import Footer from '@/components/footer'
import { useLanguage } from '@/components/language-provider'

export default function OrderSuccessPage() {
  const { lang } = useLanguage()
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/orders/${id}`, { cache: 'no-store' })
        const data = await res.json()
        if (!cancelled) setOrder(data.order || null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [id])

  const totalFormatted = useMemo(() => {
    const v = Number(order?.total_price) || 0
    return new Intl.NumberFormat(lang === 'tr' ? 'tr-TR' : 'en-US', { style: 'currency', currency: 'TRY' }).format(v)
  }, [order, lang])

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        {loading ? (
          <div className="bg-card rounded-2xl border border-border p-10">
            <div className="h-6 w-1/2 bg-muted rounded shimmer" />
            <div className="h-4 w-1/3 bg-muted rounded shimmer mt-3" />
          </div>
        ) : !order ? (
          <div className="bg-card rounded-2xl border border-border p-10 text-center">
            <div className="text-6xl mb-3">😕</div>
            <p className="text-foreground font-semibold">{lang === 'tr' ? 'Sipariş bulunamadı.' : 'Order not found.'}</p>
            <Link href="/listings" className="inline-flex mt-6 px-6 py-3 rounded-xl font-bold text-white" style={{ background: 'var(--brand-orange)' }}>
              {lang === 'tr' ? 'İlanlara dön' : 'Back to listings'}
            </Link>
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-border p-8">
            <div className="flex items-center gap-3">
              <div className="text-4xl">✅</div>
              <div>
                <h1 className="text-2xl font-extrabold text-foreground">{lang === 'tr' ? 'Siparişin alındı!' : 'Order received!'}</h1>
                <p className="text-sm text-muted-foreground mt-1">{lang === 'tr' ? 'Sipariş No:' : 'Order ID:'} <span className="font-mono">#{order.id}</span></p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl border border-border p-4">
                <div className="text-xs text-muted-foreground">{lang === 'tr' ? 'Ürün' : 'Item'}</div>
                <div className="font-semibold text-foreground mt-1 line-clamp-2">{order.listing_title || '-'}</div>
                <div className="text-sm text-muted-foreground mt-1">{lang === 'tr' ? 'Adet' : 'Qty'}: {order.quantity}</div>
              </div>
              <div className="rounded-xl border border-border p-4">
                <div className="text-xs text-muted-foreground">{lang === 'tr' ? 'Tutar' : 'Amount'}</div>
                <div className="text-xl font-extrabold text-foreground mt-1">{totalFormatted}</div>
                <div className="text-sm text-muted-foreground mt-1">{lang === 'tr' ? 'Durum' : 'Status'}: {order.status}</div>
              </div>
              <div className="rounded-xl border border-border p-4">
                <div className="text-xs text-muted-foreground">{lang === 'tr' ? 'Ödeme (demo)' : 'Payment (demo)'}</div>
                <div className="font-semibold text-foreground mt-1">
                  {order.payment?.method === 'card'
                    ? (lang === 'tr' ? `Kart •••• ${order.payment?.last4 || ''}` : `Card •••• ${order.payment?.last4 || ''}`)
                    : (lang === 'tr' ? 'Kapıda ödeme' : 'Cash on delivery')}
                </div>
              </div>
            </div>

            {order.shipping && (
              <div className="mt-4 rounded-xl border border-border p-4">
                <div className="text-xs text-muted-foreground">{lang === 'tr' ? 'Teslimat' : 'Shipping'}</div>
                <div className="font-semibold text-foreground mt-1">{order.shipping.fullName} • {order.shipping.phone}</div>
                <div className="text-sm text-muted-foreground mt-1">{order.shipping.city}/{order.shipping.district}</div>
                <div className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{order.shipping.address}</div>
              </div>
            )}

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link href="/listings" className="px-6 py-3 rounded-xl font-bold text-white text-center" style={{ background: 'var(--brand-orange)' }}>
                {lang === 'tr' ? 'Alışverişe devam et' : 'Continue shopping'}
              </Link>
              <Link href={`/listings/${order.listing_id}`} className="px-6 py-3 rounded-xl font-bold border border-border hover:bg-muted/30 text-center">
                {lang === 'tr' ? 'Ürünü görüntüle' : 'View listing'}
              </Link>
              <Link href="/cart" className="px-6 py-3 rounded-xl font-bold border border-border hover:bg-muted/30 text-center">
                {lang === 'tr' ? 'Sepet' : 'Cart'}
              </Link>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
