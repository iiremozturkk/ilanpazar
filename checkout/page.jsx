'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/navbar'
import Footer from '@/components/footer'
import { useCart } from '@/components/cart-provider'
import { useLanguage } from '@/components/language-provider'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'

const Field = ({ label, children }) => (
  <div>
    <label className="block text-sm font-semibold text-foreground mb-2">{label}</label>
    {children}
  </div>
)

export default function CheckoutPage() {
  const { lang } = useLanguage()
  const { user } = useAuth()
  const router = useRouter()
  const { items, subtotal, clear, hydrated } = useCart()

  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)

  const [shipping, setShipping] = useState({
    fullName: '',
    phone: '',
    city: '',
    district: '',
    address: '',
    zip: '',
    notes: '',
    method: 'standard',
  })

  const [payment, setPayment] = useState({
    method: 'card',
    cardName: '',
    cardNumber: '',
    expiry: '',
    cvv: '',
  })

  // Coupons
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [couponLoading, setCouponLoading] = useState(false)
  const [myCouponsOpen, setMyCouponsOpen] = useState(false)
  const [myCoupons, setMyCoupons] = useState([])

  const formattedSubtotal = useMemo(() =>
    new Intl.NumberFormat(lang === 'tr' ? 'tr-TR' : 'en-US', { style: 'currency', currency: 'TRY' }).format(subtotal || 0),
  [subtotal, lang])

  const shippingFee = useMemo(() => {
    if (shipping.method === 'express') return 79
    return 39
  }, [shipping.method])

  const discountAmount = useMemo(() => {
    const sub = Number(subtotal) || 0
    const c = appliedCoupon
    if (!c) return 0
    if (sub <= 0) return 0
    if (c.min_subtotal && sub < Number(c.min_subtotal)) return 0
    if (c.type === 'percent') {
      const pct = Math.max(0, Math.min(100, Number(c.value) || 0))
      return Math.round(sub * (pct / 100) * 100) / 100
    }
    // fixed
    const fixed = Math.max(0, Number(c.value) || 0)
    return Math.min(fixed, sub)
  }, [appliedCoupon, subtotal])

  const total = Math.max(0, (Number(subtotal) || 0) - discountAmount) + shippingFee

  const formattedTotal = useMemo(() =>
    new Intl.NumberFormat(lang === 'tr' ? 'tr-TR' : 'en-US', { style: 'currency', currency: 'TRY' }).format(total || 0),
  [total, lang])

  const formattedDiscount = useMemo(() =>
    new Intl.NumberFormat(lang === 'tr' ? 'tr-TR' : 'en-US', { style: 'currency', currency: 'TRY' }).format(discountAmount || 0),
  [discountAmount, lang])

  useEffect(() => {
    // If cart subtotal changes, keep coupon applied (server will re-validate anyway).
    // If discount becomes zero due to min_subtotal etc. we still show it applied.
  }, [subtotal])

  const loadMyCoupons = async () => {
    if (!user) return
    try {
      const res = await fetch('/api/coupons')
      const data = await res.json().catch(() => ({}))
      if (res.ok) setMyCoupons(Array.isArray(data?.coupons) ? data.coupons : [])
    } catch {
      // silent
    }
  }

  const applyCoupon = async (code) => {
    const trimmed = String(code || '').trim()
    if (!trimmed) return
    setCouponLoading(true)
    try {
      const res = await fetch(`/api/coupons?code=${encodeURIComponent(trimmed)}`)
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'COUPON_INVALID')
      setAppliedCoupon(data.coupon)
      setCouponCode(trimmed)
      toast.success(lang === 'tr' ? 'Kupon uygulandı' : 'Coupon applied')
    } catch (e) {
      setAppliedCoupon(null)
      toast.error(lang === 'tr' ? 'Kupon doğrulanamadı.' : 'Coupon could not be validated.')
    } finally {
      setCouponLoading(false)
    }
  }

  const canContinueShipping = shipping.fullName.trim() && shipping.phone.trim() && shipping.city.trim() && shipping.district.trim() && shipping.address.trim()
  const canPay = payment.method !== 'card' || (payment.cardName.trim() && payment.cardNumber.replace(/\s/g, '').length >= 12 && payment.expiry.trim() && payment.cvv.trim().length >= 3)

  const onSubmit = async () => {
    if (!hydrated) return
    if (items.length === 0) {
      toast.error(lang === 'tr' ? 'Sepet boş.' : 'Cart is empty.')
      router.push('/cart')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        items: items.map(it => ({ listingId: it.listingId, quantity: it.quantity })),
        couponCode: appliedCoupon ? (couponCode || appliedCoupon.code) : (couponCode || null),
        shipping: {
          ...shipping,
          fee: shippingFee,
        },
        payment: {
          method: payment.method,
          cardName: payment.cardName,
          cardNumber: payment.cardNumber,
          expiry: payment.expiry,
          // do NOT send/store cvv anywhere in real systems
        },
      }

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data?.error || 'error')
      }

      clear()
      toast.success(lang === 'tr' ? 'Sipariş oluşturuldu!' : 'Order created!')
      router.push(`/order-success/${data.orderId}`)
    } catch (e) {
      const msg = e?.message || 'error'
      if (msg === 'OUT_OF_STOCK') toast.error(lang === 'tr' ? 'Bazı ürünlerde yeterli stok yok.' : 'Some items do not have enough stock.')
      else toast.error(lang === 'tr' ? 'Sipariş oluşturulamadı.' : 'Could not create order.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-foreground">{lang === 'tr' ? 'Satın Alma' : 'Checkout'}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {lang === 'tr' ? 'Adres ve ödeme bilgilerini gir.' : 'Enter shipping and payment details.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {/* Stepper */}
            <div className="bg-card rounded-2xl border border-border p-4 flex items-center gap-2 text-sm">
              <div className={`px-3 py-1.5 rounded-xl font-bold ${step === 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{lang === 'tr' ? '1) Kargo' : '1) Shipping'}</div>
              <div className={`px-3 py-1.5 rounded-xl font-bold ${step === 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{lang === 'tr' ? '2) Ödeme' : '2) Payment'}</div>
              <div className={`px-3 py-1.5 rounded-xl font-bold ${step === 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{lang === 'tr' ? '3) Onay' : '3) Confirm'}</div>
            </div>

            {step === 1 && (
              <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
                <h2 className="text-lg font-bold text-foreground">{lang === 'tr' ? 'Kargo Bilgileri' : 'Shipping Information'}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label={lang === 'tr' ? 'Ad Soyad' : 'Full name'}>
                    <input value={shipping.fullName} onChange={e => setShipping(s => ({ ...s, fullName: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-border bg-background" />
                  </Field>
                  <Field label={lang === 'tr' ? 'Telefon' : 'Phone'}>
                    <input value={shipping.phone} onChange={e => setShipping(s => ({ ...s, phone: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-border bg-background" />
                  </Field>
                  <Field label={lang === 'tr' ? 'İl' : 'City'}>
                    <input value={shipping.city} onChange={e => setShipping(s => ({ ...s, city: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-border bg-background" />
                  </Field>
                  <Field label={lang === 'tr' ? 'İlçe' : 'District'}>
                    <input value={shipping.district} onChange={e => setShipping(s => ({ ...s, district: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-border bg-background" />
                  </Field>
                </div>

                <Field label={lang === 'tr' ? 'Adres' : 'Address'}>
                  <textarea value={shipping.address} onChange={e => setShipping(s => ({ ...s, address: e.target.value }))} rows={3} className="w-full px-4 py-3 rounded-xl border border-border bg-background" />
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label={lang === 'tr' ? 'Posta Kodu (opsiyonel)' : 'ZIP (optional)'}>
                    <input value={shipping.zip} onChange={e => setShipping(s => ({ ...s, zip: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-border bg-background" />
                  </Field>
                  <Field label={lang === 'tr' ? 'Kargo Seçimi' : 'Shipping method'}>
                    <select value={shipping.method} onChange={e => setShipping(s => ({ ...s, method: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-border bg-background">
                      <option value="standard">{lang === 'tr' ? 'Standart (2-4 gün)' : 'Standard (2-4 days)'}</option>
                      <option value="express">{lang === 'tr' ? 'Hızlı (1-2 gün)' : 'Express (1-2 days)'}</option>
                    </select>
                  </Field>
                </div>

                <Field label={lang === 'tr' ? 'Not (opsiyonel)' : 'Notes (optional)'}>
                  <input value={shipping.notes} onChange={e => setShipping(s => ({ ...s, notes: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-border bg-background" />
                </Field>

                <div className="flex justify-end">
                  <button
                    onClick={() => setStep(2)}
                    disabled={!canContinueShipping}
                    className="px-6 py-3 rounded-xl font-extrabold text-white disabled:opacity-50"
                    style={{ background: 'var(--brand-orange)' }}
                  >
                    {lang === 'tr' ? 'Ödemeye geç' : 'Continue to payment'}
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
                <h2 className="text-lg font-bold text-foreground">{lang === 'tr' ? 'Ödeme' : 'Payment'}</h2>

                {/* Coupon / Discount */}
                <div className="rounded-2xl border border-border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-extrabold text-foreground">{lang === 'tr' ? 'Kupon / İndirim' : 'Coupon / Discount'}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {lang === 'tr' ? 'Kupon kodu gir veya kuponlarını kullan.' : 'Enter a code or use your available coupons.'}
                      </div>
                    </div>
                    {user && (
                      <button
                        type="button"
                        onClick={async () => {
                          const next = !myCouponsOpen
                          setMyCouponsOpen(next)
                          if (next) await loadMyCoupons()
                        }}
                        className="text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/8"
                        style={{ color: 'var(--brand-orange)' }}
                      >
                        {lang === 'tr' ? 'Kuponlarımı kullan' : 'Use my coupons'}
                      </button>
                    )}
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <input
                      value={couponCode}
                      onChange={e => setCouponCode(e.target.value)}
                      placeholder={lang === 'tr' ? 'Kupon kodu' : 'Coupon code'}
                      className="flex-1 px-4 py-3 rounded-xl border border-border bg-background"
                    />
                    <button
                      type="button"
                      disabled={couponLoading || !couponCode.trim()}
                      onClick={() => applyCoupon(couponCode)}
                      className="px-4 py-3 rounded-xl font-extrabold text-white disabled:opacity-50"
                      style={{ background: 'var(--brand-orange)' }}
                    >
                      {couponLoading ? (lang === 'tr' ? 'Kontrol…' : 'Checking…') : (lang === 'tr' ? 'Uygula' : 'Apply')}
                    </button>
                  </div>

                  {appliedCoupon && (
                    <div className="mt-3 flex items-center justify-between gap-3 rounded-xl px-3 py-2" style={{ background: 'color-mix(in oklab, var(--brand-orange) 10%, transparent)', border: '1px solid color-mix(in oklab, var(--brand-orange) 25%, var(--border))' }}>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-foreground truncate">{appliedCoupon.code}</div>
                        <div className="text-xs text-muted-foreground">
                          {appliedCoupon.type === 'percent'
                            ? (lang === 'tr' ? `%${appliedCoupon.value} indirim` : `${appliedCoupon.value}% off`)
                            : (lang === 'tr' ? `${appliedCoupon.value}₺ indirim` : `${appliedCoupon.value}₺ off`)}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setAppliedCoupon(null); toast.success(lang === 'tr' ? 'Kupon kaldırıldı' : 'Coupon removed') }}
                        className="text-xs font-bold px-2.5 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/8"
                      >
                        {lang === 'tr' ? 'Kaldır' : 'Remove'}
                      </button>
                    </div>
                  )}

                  {myCouponsOpen && user && (
                    <div className="mt-3">
                      {myCoupons?.length ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {myCoupons.map(c => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => applyCoupon(c.code)}
                              className="text-left rounded-xl border border-border p-3 hover:bg-muted/30 transition-colors"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="text-sm font-extrabold text-foreground truncate">{c.code}</div>
                                  <div className="text-xs text-muted-foreground mt-0.5">
                                    {c.type === 'percent'
                                      ? (lang === 'tr' ? `%${c.value} indirim` : `${c.value}% off`)
                                      : (lang === 'tr' ? `${c.value}₺ indirim` : `${c.value}₺ off`)}
                                  </div>
                                </div>
                                <div className="text-xs font-bold" style={{ color: 'var(--brand-orange)' }}>{lang === 'tr' ? 'Kullan' : 'Use'}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">{lang === 'tr' ? 'Tanımlı kupon bulunamadı.' : 'No coupons found.'}</div>
                      )}
                    </div>
                  )}
                </div>

                <Field label={lang === 'tr' ? 'Ödeme Yöntemi' : 'Payment method'}>
                  <select value={payment.method} onChange={e => setPayment(p => ({ ...p, method: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-border bg-background">
                    <option value="card">{lang === 'tr' ? 'Kart' : 'Card'}</option>
                    <option value="cod">{lang === 'tr' ? 'Kapıda Ödeme (demo)' : 'Cash on delivery (demo)'}</option>
                  </select>
                </Field>

                {payment.method === 'card' && (
                  <>
                    <Field label={lang === 'tr' ? 'Kart Üzerindeki İsim' : 'Name on card'}>
                      <input value={payment.cardName} onChange={e => setPayment(p => ({ ...p, cardName: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-border bg-background" />
                    </Field>
                    <Field label={lang === 'tr' ? 'Kart Numarası' : 'Card number'}>
                      <input value={payment.cardNumber} onChange={e => setPayment(p => ({ ...p, cardNumber: e.target.value }))} placeholder="0000 0000 0000 0000" className="w-full px-4 py-3 rounded-xl border border-border bg-background" />
                    </Field>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label={lang === 'tr' ? 'Son Kullanma' : 'Expiry'}>
                        <input value={payment.expiry} onChange={e => setPayment(p => ({ ...p, expiry: e.target.value }))} placeholder="MM/YY" className="w-full px-4 py-3 rounded-xl border border-border bg-background" />
                      </Field>
                      <Field label={lang === 'tr' ? 'CVV' : 'CVV'}>
                        <input value={payment.cvv} onChange={e => setPayment(p => ({ ...p, cvv: e.target.value }))} placeholder="123" className="w-full px-4 py-3 rounded-xl border border-border bg-background" />
                      </Field>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {lang === 'tr'
                        ? 'Demo: Kart bilgileri gerçek bir ödeme işlemi için kullanılmaz. CVV hiçbir yerde saklanmaz.'
                        : 'Demo: Card data is not used for real payments. CVV is not stored.'}
                    </p>
                  </>
                )}

                <div className="flex items-center justify-between">
                  <button onClick={() => setStep(1)} className="px-6 py-3 rounded-xl font-bold border border-border hover:bg-muted/30">
                    {lang === 'tr' ? 'Geri' : 'Back'}
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    disabled={!canPay}
                    className="px-6 py-3 rounded-xl font-extrabold text-white disabled:opacity-50"
                    style={{ background: 'var(--brand-orange)' }}
                  >
                    {lang === 'tr' ? 'Onaya geç' : 'Review order'}
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
                <h2 className="text-lg font-bold text-foreground">{lang === 'tr' ? 'Onay' : 'Confirm'}</h2>

                <div className="rounded-xl border border-border p-4">
                  <div className="text-sm text-muted-foreground">{lang === 'tr' ? 'Teslimat' : 'Delivery'}</div>
                  <div className="font-semibold text-foreground mt-1">{shipping.fullName} • {shipping.phone}</div>
                  <div className="text-sm text-muted-foreground mt-1">{shipping.city}/{shipping.district}</div>
                  <div className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{shipping.address}</div>
                </div>

                <div className="rounded-xl border border-border p-4">
                  <div className="text-sm text-muted-foreground">{lang === 'tr' ? 'Ödeme' : 'Payment'}</div>
                  <div className="font-semibold text-foreground mt-1">
                    {payment.method === 'card' ? (lang === 'tr' ? 'Kart (demo)' : 'Card (demo)') : (lang === 'tr' ? 'Kapıda ödeme (demo)' : 'Cash on delivery (demo)')}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <button onClick={() => setStep(2)} className="px-6 py-3 rounded-xl font-bold border border-border hover:bg-muted/30">
                    {lang === 'tr' ? 'Geri' : 'Back'}
                  </button>
                  <button
                    onClick={onSubmit}
                    disabled={submitting}
                    className="px-6 py-3 rounded-xl font-extrabold text-white disabled:opacity-50"
                    style={{ background: 'var(--brand-orange)' }}
                  >
                    {submitting ? (lang === 'tr' ? 'Gönderiliyor…' : 'Submitting…') : (lang === 'tr' ? 'Siparişi Oluştur' : 'Place order')}
                  </button>
                </div>
              </div>
            )}
          </div>

          <aside className="bg-card rounded-2xl border border-border p-6 h-fit">
            <h2 className="text-lg font-bold text-foreground mb-4">{lang === 'tr' ? 'Özet' : 'Summary'}</h2>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>{lang === 'tr' ? 'Ara toplam' : 'Subtotal'}</span>
                <span>{formattedSubtotal}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>{lang === 'tr' ? 'Kargo' : 'Shipping'}</span>
                <span>{new Intl.NumberFormat(lang === 'tr' ? 'tr-TR' : 'en-US', { style: 'currency', currency: 'TRY' }).format(shippingFee)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex items-center justify-between">
                  <span>{lang === 'tr' ? 'Kupon indirimi' : 'Coupon discount'}</span>
                  <span className="font-semibold" style={{ color: 'var(--brand-orange)' }}>- {formattedDiscount}</span>
                </div>
              )}
              <div className="h-px bg-border my-3" />
              <div className="flex items-center justify-between text-base">
                <span className="font-semibold text-foreground">{lang === 'tr' ? 'Toplam' : 'Total'}</span>
                <span className="text-xl font-extrabold text-foreground">{formattedTotal}</span>
              </div>
            </div>

            <div className="h-px bg-border my-4" />

            <div className="space-y-3">
              {(items || []).slice(0, 6).map((it) => (
                <div key={it.listingId} className="flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <div className="font-semibold text-foreground line-clamp-1">{it.title}</div>
                    <div className="text-xs text-muted-foreground">{lang === 'tr' ? 'Adet' : 'Qty'}: {it.quantity}</div>
                  </div>
                  <div className="font-bold text-foreground">
                    {new Intl.NumberFormat(lang === 'tr' ? 'tr-TR' : 'en-US', { style: 'currency', currency: 'TRY' }).format((Number(it.price) || 0) * (it.quantity || 0))}
                  </div>
                </div>
              ))}
              {items.length > 6 && (
                <div className="text-xs text-muted-foreground">{lang === 'tr' ? `+${items.length - 6} ürün daha` : `+${items.length - 6} more items`}</div>
              )}
            </div>

            <button
              onClick={() => router.push('/cart')}
              className="mt-6 w-full px-5 py-3 rounded-xl font-semibold border border-border hover:bg-muted/30"
            >
              {lang === 'tr' ? 'Sepete dön' : 'Back to cart'}
            </button>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  )
}
