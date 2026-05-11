'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import Navbar from '@/components/navbar'
import Footer from '@/components/footer'
import { useLanguage } from '@/components/language-provider'

const statusMap = {
  tr: {
    created: 'Yeni',
    paid: 'Ödendi',
    shipped: 'Kargoda',
    cancel_requested: 'İptal talebi',
    return_requested: 'İade talebi',
    returned: 'İade edildi',
    cancelled: 'İptal edildi',
  },
  en: {
    created: 'New',
    paid: 'Paid',
    shipped: 'Shipped',
    cancel_requested: 'Cancel requested',
    return_requested: 'Return requested',
    returned: 'Returned',
    cancelled: 'Cancelled',
  },
}

export default function SaleDetailPage() {
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

  const shipping = order?.shipping && typeof order.shipping === 'object' ? order.shipping : null
  const payment = order?.payment && typeof order.payment === 'object' ? order.payment : null
  const statusLabel = statusMap[lang]?.[order?.status] || order?.status || '—'

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
            <p className="text-foreground font-semibold">{lang === 'tr' ? 'Satış detayı bulunamadı.' : 'Sale detail not found.'}</p>
            <Link href="/sales" className="inline-flex mt-6 px-6 py-3 rounded-xl font-bold text-white" style={{ background: 'var(--brand-orange)' }}>
              {lang === 'tr' ? 'Satışlara dön' : 'Back to sales'}
            </Link>
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-border p-8">
            <div className="flex items-center gap-3">
              <div className="text-4xl">📦</div>
              <div>
                <h1 className="text-2xl font-extrabold text-foreground">{lang === 'tr' ? 'Satış Detayı' : 'Sale Detail'}</h1>
                <p className="text-sm text-muted-foreground mt-1">{lang === 'tr' ? 'Sipariş No:' : 'Order ID:'} <span className="font-mono">#{order.id}</span></p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl border border-border p-4">
                <div className="text-xs text-muted-foreground">{lang === 'tr' ? 'İlan' : 'Listing'}</div>
                <div className="font-semibold text-foreground mt-1 line-clamp-2">{order.listing_title || '-'}</div>
                <div className="text-sm text-muted-foreground mt-1">{lang === 'tr' ? 'Adet' : 'Qty'}: {order.quantity}</div>
              </div>
              <div className="rounded-xl border border-border p-4">
                <div className="text-xs text-muted-foreground">{lang === 'tr' ? 'Tutar' : 'Amount'}</div>
                <div className="text-xl font-extrabold text-foreground mt-1">{totalFormatted}</div>
                <div className="text-sm text-muted-foreground mt-1">{lang === 'tr' ? 'Durum' : 'Status'}: {statusLabel}</div>
              </div>
              <div className="rounded-xl border border-border p-4">
                <div className="text-xs text-muted-foreground">{lang === 'tr' ? 'Alıcı' : 'Buyer'}</div>
                <div className="font-semibold text-foreground mt-1">{order.shipping?.fullName || (lang === 'tr' ? 'Belirtilmedi' : 'Not specified')}</div>
                <div className="text-sm text-muted-foreground mt-1">{payment?.method === 'card' ? (lang === 'tr' ? `Kart •••• ${payment?.last4 || ''}` : `Card •••• ${payment?.last4 || ''}`) : (lang === 'tr' ? 'Kapıda ödeme' : 'Cash on delivery')}</div>
              </div>
            </div>

            {shipping && (
              <div className="mt-4 rounded-xl border border-border p-4">
                <div className="text-xs text-muted-foreground">{lang === 'tr' ? 'Teslimat Bilgisi' : 'Shipping Details'}</div>
                <div className="font-semibold text-foreground mt-1">{shipping.fullName} • {shipping.phone}</div>
                <div className="text-sm text-muted-foreground mt-1">{shipping.city}/{shipping.district}</div>
                <div className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{shipping.address}</div>
                {shipping.carrier && shipping.trackingNumber && (
                  <div className="text-sm text-muted-foreground mt-3">
                    {lang === 'tr' ? 'Kargo:' : 'Carrier:'} <span className="font-medium text-foreground">{shipping.carrier}</span> · {lang === 'tr' ? 'Takip No:' : 'Tracking:'} <span className="font-medium text-foreground">{shipping.trackingNumber}</span>
                  </div>
                )}
              </div>
            )}

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link href="/sales" className="px-6 py-3 rounded-xl font-bold text-white text-center" style={{ background: 'var(--brand-orange)' }}>
                {lang === 'tr' ? 'Satışlara dön' : 'Back to sales'}
              </Link>
              <Link href={`/listings/${order.listing_id}`} className="px-6 py-3 rounded-xl font-bold border border-border hover:bg-muted/30 text-center">
                {lang === 'tr' ? 'İlanı görüntüle' : 'View listing'}
              </Link>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
