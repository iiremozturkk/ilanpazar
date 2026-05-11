'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/components/language-provider'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Truck, RefreshCw, Package } from 'lucide-react'

function StatusBadge({ status, lang }) {
  const t = (tr, en) => (lang === 'tr' ? tr : en)
  const map = {
    created: { label: t('Yeni', 'New'), variant: 'secondary' },
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

export default function SalesPage() {
  const { lang } = useLanguage()
  const t = (tr, en) => (lang === 'tr' ? tr : en)

  const router = useRouter()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  const [shipOpen, setShipOpen] = useState(false)
  const [shipOrder, setShipOrder] = useState(null)
  const [carrier, setCarrier] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/sales')
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

  function openShip(o) {
    setShipOrder(o)
    const shipping = o.shipping && typeof o.shipping === 'object' ? o.shipping : null
    setCarrier(shipping?.carrier || '')
    setTrackingNumber(shipping?.trackingNumber || '')
    setShipOpen(true)
  }

  async function submitShip() {
    if (!shipOrder) return
    if (!carrier.trim() || !trackingNumber.trim()) {
      toast.error(t('Kargo firması ve takip no gerekli.','Carrier and tracking number are required.'))
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/sales/${shipOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ship', carrier, trackingNumber }),
      })
      if (!res.ok) {
        toast.error(t('İşlem başarısız.','Action failed.'))
        return
      }
      toast.success(t('Kargoya verildi olarak işaretlendi.','Marked as shipped.'))
      setShipOpen(false)
      setShipOrder(null)
      await load()
    } catch {
      toast.error(t('İşlem başarısız.','Action failed.'))
    } finally {
      setSaving(false)
    }
  }

  async function approve(orderId, kind) {
    const ok = confirm(kind === 'cancel' ? t('İptal talebini onaylamak istiyor musun?','Approve the cancel request?') : t('İade talebini onaylamak istiyor musun?','Approve the return request?'))
    if (!ok) return
    try {
      const res = await fetch(`/api/sales/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: kind === 'cancel' ? 'approve_cancel' : 'approve_return' }),
      })
      if (!res.ok) {
        toast.error(t('İşlem başarısız.','Action failed.'))
        return
      }
      toast.success(t('İşlem tamamlandı.','Done.'))
      await load()
    } catch {
      toast.error(t('İşlem başarısız.','Action failed.'))
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t('Satışlarım','My Sales')}</h1>
          <p className="text-sm text-muted-foreground">{t('Satıcı olarak aldığın siparişler ve kargo işlemleri.','Orders you received as a seller and shipping actions.')}</p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading}>
          <RefreshCw className="h-4 w-4 mr-2" /> {t('Yenile','Refresh')}
        </Button>
      </div>

      {loading && <div className="text-sm text-muted-foreground">{t('Yükleniyor…','Loading…')}</div>}

      {empty && (
        <Card className="rounded-2xl">
          <CardContent className="p-8 text-center">
            <Package className="h-8 w-8 mx-auto mb-3 opacity-60" />
            <div className="font-semibold">{t('Henüz satış yok','No sales yet')}</div>
            <div className="text-sm text-muted-foreground mt-1">{t('İlanların sipariş aldığında burada görünecek.','This will show up when your listings receive orders.')}</div>
            <Button asChild className="mt-4">
              <Link href="/dashboard">{t('Panelime Git','Go to Dashboard')}</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {orders.map(o => {
          const shipping = o.shipping && typeof o.shipping === 'object' ? o.shipping : null
          const carrier0 = shipping?.carrier
          const tracking0 = shipping?.trackingNumber
          const canShip = !['shipped', 'cancelled', 'cancel_requested', 'return_requested', 'returned'].includes(o.status)
          const canApproveCancel = o.status === 'cancel_requested'
          const canApproveReturn = o.status === 'return_requested'

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
                        {t('Sipariş No:','Order No:')} <span className="font-medium">#{o.id}</span> · {t('Alıcı:','Buyer:')} <span className="font-medium">{o.buyer_name || '—'}</span>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {t('Adet:','Qty:')} <span className="font-medium">{o.quantity}</span> · {t('Tutar:','Total:')} <span className="font-medium">{Number(o.total_price || 0).toFixed(2)} ₺</span>
                      </div>
                      {carrier0 && tracking0 && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          {t('Kargo:','Carrier:')} <span className="font-medium">{carrier0}</span> · {t('Takip:','Tracking:')} <span className="font-medium">{tracking0}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 items-end">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/sales/${o.id}`}>{t('Detay','Details')}</Link>
                    </Button>
                    {canApproveCancel && (
                      <Button variant="destructive" size="sm" onClick={() => approve(o.id, 'cancel')}>
                        {t('İptali onayla','Approve cancel')}
                      </Button>
                    )}
                    {canApproveReturn && (
                      <Button variant="secondary" size="sm" onClick={() => approve(o.id, 'return')}>
                        {t('İadeyi onayla','Approve return')}
                      </Button>
                    )}
                    <Button size="sm" disabled={!canShip} onClick={() => openShip(o)}>
                      <Truck className="h-4 w-4 mr-2" /> {t('Kargoya verildi','Mark shipped')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Dialog open={shipOpen} onOpenChange={setShipOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>{t('Kargoya Verildi','Mark as shipped')}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div>
              <label className="text-sm font-medium">{t('Kargo Firması','Carrier')}</label>
              <Input value={carrier} onChange={e => setCarrier(e.target.value)} placeholder={t('Örn. Yurtiçi / MNG / Aras','e.g. UPS / DHL / FedEx')} />
            </div>
            <div>
              <label className="text-sm font-medium">{t('Takip Numarası','Tracking number')}</label>
              <Input value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} placeholder={t('Takip no','Tracking no')} />
            </div>
            <div className="text-xs text-muted-foreground">{t('Bu işlem alıcıya bildirim gönderir.','This action notifies the buyer.')}</div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShipOpen(false)} disabled={saving}>{t('Vazgeç','Cancel')}</Button>
            <Button onClick={submitShip} disabled={saving}>{saving ? t('Kaydediliyor…','Saving…') : t('Kaydet','Save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
