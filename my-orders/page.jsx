'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/components/language-provider'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { Package, Truck, XCircle, RefreshCw } from 'lucide-react'

function StatusBadge({ status, lang }) {
  const t = (tr, en) => (lang === 'tr' ? tr : en)
  const map = {
    created: { label: t('Hazırlanıyor', 'Preparing'), variant: 'secondary' },
    paid: { label: t('Ödendi', 'Paid'), variant: 'default' },
    shipped: { label: t('Kargoda', 'Shipped'), variant: 'default' },
    cancel_requested: { label: t('İptal talebi', 'Cancel requested'), variant: 'secondary' },
    return_requested: { label: t('İade talebi', 'Return requested'), variant: 'secondary' },
    returned: { label: t('İade', 'Returned'), variant: 'secondary' },
    cancelled: { label: t('İptal', 'Cancelled'), variant: 'destructive' },
  }
  const s = map[status] || { label: status || '—', variant: 'secondary' }
  return <Badge variant={s.variant}>{s.label}</Badge>
}

export default function MyOrdersPage() {
  const { lang } = useLanguage()
  const t = (tr, en) => (lang === 'tr' ? tr : en)

  const router = useRouter()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/my-orders')
      if (res.status === 401) {
        router.push('/login')
        return
      }
      const data = await res.json()
      setOrders(data.orders || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const empty = useMemo(() => !loading && orders.length === 0, [loading, orders])

  async function doAction(orderId, action) {
    const ok = confirm(action === 'cancel' ? t('İptal talebi oluşturulsun mu?','Create a cancel request?') : t('İade talebi oluşturulsun mu?','Create a return request?'))
    if (!ok) return
    try {
      const res = await fetch(`/api/my-orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data?.error === 'NOT_CANCELLABLE' ? t('Bu sipariş artık iptal edilemez.','This order can no longer be cancelled.') : t('İşlem başarısız.','Action failed.'))
        return
      }
      toast.success(action === 'cancel' ? t('İptal talebi gönderildi','Cancel request sent') : t('İade talebi gönderildi','Return request sent'))
      await load()
    } catch {
      toast.error(t('İşlem başarısız.','Action failed.'))
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t('Siparişlerim','My Orders')}</h1>
          <p className="text-sm text-muted-foreground">{t('Satın aldığın ürünlerin durumu, kargo ve işlemleri.','Track your purchases, shipping, and actions.')}</p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading}>
          <RefreshCw className="h-4 w-4 mr-2" /> {t('Yenile','Refresh')}
        </Button>
      </div>

      {loading && (
        <div className="text-sm text-muted-foreground">{t('Yükleniyor…','Loading…')}</div>
      )}

      {empty && (
        <Card className="rounded-2xl">
          <CardContent className="p-8 text-center">
            <Package className="h-8 w-8 mx-auto mb-3 opacity-60" />
            <div className="font-semibold">{t('Henüz sipariş yok','No orders yet')}</div>
            <div className="text-sm text-muted-foreground mt-1">{t('İlanlara göz atıp ilk siparişini verebilirsin.','Browse listings to place your first order.')}</div>
            <Button asChild className="mt-4">
              <Link href="/listings">{t('İlanlara Git','Browse Listings')}</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {orders.map(o => {
          const shipping = o.shipping && typeof o.shipping === 'object' ? o.shipping : null
          const carrier = shipping?.carrier
          const trackingNumber = shipping?.trackingNumber
          const canCancel = ['created', 'paid'].includes(o.status) && o.status !== 'cancel_requested'
          const canReturn = ['shipped'].includes(o.status) && !['return_requested', 'returned', 'cancelled'].includes(o.status)

          return (
            <Card key={o.id} className="rounded-2xl">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted shrink-0">
                      {o.cover_image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={o.cover_image} alt={o.listing_title || ''} className="w-full h-full object-cover" />
                      ) : null}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="font-semibold">{o.listing_title || (lang === 'tr' ? `Sipariş #${o.id}` : `Order #${o.id}`)}</div>
                        <StatusBadge status={o.status} lang={lang} />
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {t('Sipariş No:','Order No:')} <span className="font-medium">#{o.id}</span> · {t('Satıcı:','Seller:')} <span className="font-medium">{o.seller_name || '—'}</span>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {t('Adet:','Qty:')} <span className="font-medium">{o.quantity}</span> · {t('Tutar:','Total:')} <span className="font-medium">{Number(o.total_price || 0).toFixed(2)} ₺</span>
                      </div>

                      {carrier && trackingNumber && (
                        <div className="mt-3 flex items-center gap-2 text-sm">
                          <Truck className="h-4 w-4" />
                          <span className="text-muted-foreground">{t('Kargo Takip:','Tracking:')}</span>
                          <span className="font-medium">{carrier} / {trackingNumber}</span>
                        </div>
                      )}

                      {o.status === 'cancel_requested' && (
                        <div className="mt-2 text-xs text-muted-foreground">{t('İptal talebi satıcı onayı bekliyor.','Cancel request is awaiting seller approval.')}</div>
                      )}
                      {o.status === 'return_requested' && (
                        <div className="mt-2 text-xs text-muted-foreground">{t('İade talebi satıcı onayı bekliyor.','Return request is awaiting seller approval.')}</div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 items-end">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/order-success/${o.id}`}>{t('Detay','Details')}</Link>
                    </Button>
                    <Button variant="destructive" size="sm" disabled={!canCancel} onClick={() => doAction(o.id, 'cancel')}>
                      <XCircle className="h-4 w-4 mr-2" /> {t('İptal Talebi','Cancel')}
                    </Button>
                    <Button variant="secondary" size="sm" disabled={!canReturn} onClick={() => doAction(o.id, 'return')}>
                      {t('İade Talebi','Return')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
