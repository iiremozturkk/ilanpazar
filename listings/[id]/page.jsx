'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight, MapPin, Calendar, Eye, MessageSquare, Share2, Tag, ArrowLeft, ShoppingCart, CreditCard, Star, BadgeCheck, Flag } from 'lucide-react'
import Navbar from '@/components/navbar'
import Footer from '@/components/footer'
import ListingCard from '@/components/listing-card'
import FavoriteButton from '@/components/favorite-button'
import { useLanguage } from '@/components/language-provider'
import { useCart } from '@/components/cart-provider'
import { useAuth } from '@/hooks/use-auth'
import { CATEGORIES } from '@/lib/i18n'
import { format } from 'date-fns'
import { tr, enUS } from 'date-fns/locale'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

export default function ListingDetailPage() {
  const { t, lang } = useLanguage()
  const { user } = useAuth()
  const { id } = useParams()
  const router = useRouter()
  const [listing, setListing] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [imageIdx, setImageIdx] = useState(0)
  const [zoomOpen, setZoomOpen] = useState(false)
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 })
  const [isZoomHovering, setIsZoomHovering] = useState(false)
  const [sendingMsg, setSendingMsg] = useState(false)
  const [reviews, setReviews] = useState([])
  const [reviewSummary, setReviewSummary] = useState({ count: 0, avg: 0 })
  const [reviewMe, setReviewMe] = useState(null)
  const [loadingReviews, setLoadingReviews] = useState(false)
  const [reviewForm, setReviewForm] = useState({ rating: 5, message: '' })
  const [reviewSort, setReviewSort] = useState('newest') // newest | stars
  const [reportReason, setReportReason] = useState('')
  const [reportLoading, setReportLoading] = useState(false)
  const [offerAmount, setOfferAmount] = useState('')
  const [offerLoading, setOfferLoading] = useState(false)
  const locale = lang === 'tr' ? tr : enUS
  const { addItem } = useCart()

  useEffect(() => {
    fetch(`/api/listings/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.listing) {
          setListing(data.listing)
          // fetch related
          fetch(`/api/listings?category=${data.listing.category}&page=1`)
            .then(r => r.json())
            .then(d => setRelated((d.listings || []).filter(l => l.id !== parseInt(id)).slice(0, 4)))
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  const fetchReviews = async (sort = reviewSort) => {
    setLoadingReviews(true)
    try {
      const res = await fetch(`/api/listings/${id}/reviews?me=1&sort=${encodeURIComponent(sort || 'newest')}`)
      const data = await res.json()
      setReviews(data.reviews || [])
      setReviewSummary(data.summary || { count: 0, avg: 0 })
      setReviewMe(data.me || null)
    } catch {
      setReviews([])
      setReviewSummary({ count: 0, avg: 0 })
      setReviewMe(null)
    } finally {
      setLoadingReviews(false)
    }
  }

  useEffect(() => {
    if (!id) return
    fetchReviews()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    if (!id) return
    fetchReviews(reviewSort)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewSort])

  const images = listing?.images || (listing?.cover_image ? [listing.cover_image] : [])

  useEffect(() => {
    if (!zoomOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setZoomOpen(false)
      if (images.length > 1 && e.key === 'ArrowLeft') {
        setImageIdx((i) => (i - 1 + images.length) % images.length)
      }
      if (images.length > 1 && e.key === 'ArrowRight') {
        setImageIdx((i) => (i + 1) % images.length)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [zoomOpen, images.length])

  const prevImage = () => setImageIdx(i => (i - 1 + images.length) % images.length)
  const nextImage = () => setImageIdx(i => (i + 1) % images.length)

  const handleZoomMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setZoomPos({
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    })
  }

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Link kopyalandı!')
    } catch (e) {
      const msg = String(e?.message || '')
      if (msg.includes('NOT_VERIFIED_PURCHASE')) {
        toast.error(lang === 'tr' ? 'Sadece satın alan kullanıcı değerlendirme yapabilir.' : 'Only verified purchasers can review.')
      } else if (msg.includes('DUPLICATE')) {
        toast.error(lang === 'tr' ? 'Bu sipariş için zaten yorum bıraktınız.' : 'You already reviewed this order.')
      } else {
        toast.error(lang === 'tr' ? 'Değerlendirme eklenemedi.' : 'Could not add review.')
      }
    }
  }

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    setSendingMsg(true)
    try {
      const res = await fetch(`/api/listings/${id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: reviewForm.rating,
          message: reviewForm.message,
          orderId: Array.isArray(reviewMe?.pendingOrderIds) ? reviewMe.pendingOrderIds?.[0] : undefined,
        }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'error')
      }
      toast.success(lang === 'tr' ? 'Değerlendirmeniz eklendi!' : 'Your review was added!')
      setReviewForm({ rating: 5, message: '' })
      await fetchReviews()
    } catch (e) {
      const msg = String(e?.message || '')
      if (msg.includes('NOT_VERIFIED_PURCHASE')) {
        toast.error(lang === 'tr' ? 'Sadece satın alan kullanıcı değerlendirme yapabilir.' : 'Only verified purchasers can review.')
      } else if (msg.includes('DUPLICATE')) {
        toast.error(lang === 'tr' ? 'Bu sipariş için zaten yorum bıraktınız.' : 'You already reviewed this order.')
      } else {
        toast.error(lang === 'tr' ? 'Değerlendirme eklenemedi.' : 'Could not add review.')
      }
    } finally {
      setSendingMsg(false)
    }
  }

  const handleReport = async () => {
    const reason = reportReason.trim()
    if (reason.length < 3) {
      toast.error(lang === 'tr' ? 'Lütfen bir gerekçe yazın.' : 'Please enter a reason.')
      return
    }
    setReportLoading(true)
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: Number(id), reason }),
      })
      if (res.status === 409) {
        // Sonner'da `toast.message` her sürümde bulunmayabiliyor.
        // Bu yüzden düz `toast()` kullanarak bilgilendirme mesajı gösteriyoruz.
        toast(lang === 'tr' ? 'Bu ilanı zaten bildirdiniz.' : 'You already reported this listing.')
        return
      }
      if (!res.ok) {
        throw new Error('error')
      }
      toast.success(lang === 'tr' ? 'Bildiriminiz admin ekibine iletildi.' : 'Your report was sent to the admin team.')
      setReportReason('')
    } catch {
      toast.error(lang === 'tr' ? 'Bildirim gönderilemedi.' : 'Could not send report.')
    } finally {
      setReportLoading(false)
    }
  }

  const cat = CATEGORIES.find(c => c.id === listing?.category)

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 pt-24 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="aspect-[4/3] bg-muted rounded-2xl shimmer" />
            </div>
            <div className="space-y-4">
              <div className="h-8 bg-muted rounded shimmer" />
              <div className="h-6 bg-muted rounded w-1/3 shimmer" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  const isOwner = user && Number(user.id) === Number(listing?.user_id)

  const startChat = async () => {
    if (!user) {
      router.push('/login')
      return
    }
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: Number(id) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'error')
      router.push(`/messages/${data.conversationId}`)
    } catch {
      toast.error(lang === 'tr' ? 'Sohbet başlatılamadı' : 'Could not start chat')
    }
  }

  const makeOffer = async () => {
    if (!user) {
      router.push('/login')
      return
    }
    const amt = Number(String(offerAmount).replace(',', '.'))
    if (!amt || amt <= 0) {
      toast.error(lang === 'tr' ? 'Geçerli bir teklif girin' : 'Enter a valid amount')
      return
    }
    setOfferLoading(true)
    try {
      const res = await fetch('/api/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: Number(id), amount: amt }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'error')
      toast.success(lang === 'tr' ? 'Teklif gönderildi' : 'Offer sent')
      setOfferAmount('')
      router.push(`/messages/${data.conversationId}`)
    } catch {
      toast.error(lang === 'tr' ? 'Teklif gönderilemedi' : 'Could not send offer')
    } finally {
      setOfferLoading(false)
    }
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-40 text-center">
          <div className="text-7xl mb-6">😕</div>
          <h2 className="text-2xl font-bold text-foreground mb-2">İlan bulunamadı</h2>
          <button onClick={() => router.back()} className="mt-4 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90">
            {t.common.back}
          </button>
        </div>
      </div>
    )
  }

  const formattedDate = listing.created_at
    ? format(new Date(listing.created_at), 'dd MMMM yyyy', { locale })
    : ''

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
        {/* Breadcrumb */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          {t.common.back}
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Images + Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Gallery */}
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              <div className="relative aspect-[4/3] bg-gradient-to-br from-muted/80 via-background to-muted/60">
                {images.length > 0 ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setZoomOpen(true)}
                      className="flex h-full w-full items-center justify-center p-3 sm:p-4 text-left"
                    >
                      <img
                        src={images[imageIdx]}
                        alt={listing.title}
                        className="max-h-full max-w-full rounded-xl object-contain shadow-[0_18px_50px_rgba(0,0,0,0.18)] transition-transform duration-300 hover:scale-[1.01]"
                      />
                      <div className="absolute bottom-3 right-3 rounded-full bg-black/65 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
                        {lang === 'tr' ? 'Büyüt' : 'Zoom'}
                      </div>
                    </button>
                    {images.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); prevImage() }}
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-colors"
                        >
                          <ChevronLeft size={20} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); nextImage() }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-colors"
                        >
                          <ChevronRight size={20} />
                        </button>
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                          {images.map((_, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setImageIdx(i) }}
                              className={`w-2 h-2 rounded-full transition-all ${i === imageIdx ? 'bg-white w-5' : 'bg-white/50'}`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-8xl">
                    {cat?.icon || '📦'}
                  </div>
                )}
              </div>

              {/* Thumbnail strip */}
              {images.length > 1 && (
                <div className="p-3 flex gap-2 overflow-x-auto">
                  {images.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => setImageIdx(i)}
                      className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${i === imageIdx ? 'border-primary' : 'border-transparent'}`}
                    >
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {zoomOpen && images.length > 0 && (
              <div
                className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm px-3 py-4 sm:px-6"
                onClick={() => setZoomOpen(false)}
              >
                <div
                  className="mx-auto flex h-full max-w-7xl flex-col gap-3 text-white"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-base font-semibold">
                        {lang === 'tr' ? 'Görseli incele' : 'Inspect image'}
                      </div>
                      <div className="mt-1 text-xs text-white/70 sm:text-sm">
                        {lang === 'tr'
                          ? 'Masaüstünde fotoğrafın üstünde gezdirerek yakın bakabilirsin. Mobilde alttaki küçük görsellerden geçiş yapabilirsin.'
                          : 'Hover over the photo on desktop to inspect details. On mobile, use the thumbnails below to switch images.'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setZoomOpen(false)}
                      className="shrink-0 rounded-full border border-white/20 px-3 py-1.5 text-sm hover:bg-white/10"
                    >
                      {lang === 'tr' ? 'Kapat' : 'Close'}
                    </button>
                  </div>

                  <div className="min-h-0 flex-1 rounded-[28px] bg-neutral-950/95 p-3 sm:p-4">
                    <div
                      className="relative flex h-full min-h-0 items-center justify-center overflow-hidden rounded-2xl bg-black"
                      onMouseMove={handleZoomMove}
                      onMouseEnter={() => setIsZoomHovering(true)}
                      onMouseLeave={() => setIsZoomHovering(false)}
                    >
                      <img
                        src={images[imageIdx]}
                        alt={listing.title}
                        className="max-h-[calc(100vh-240px)] w-auto max-w-full select-none object-contain transition-transform duration-150 ease-out"
                        style={{
                          transform: isZoomHovering ? 'scale(2)' : 'scale(1)',
                          transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                          cursor: isZoomHovering ? 'zoom-out' : 'zoom-in',
                        }}
                        draggable="false"
                      />
                      {images.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={prevImage}
                            className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition hover:bg-black/70"
                          >
                            <ChevronLeft size={20} />
                          </button>
                          <button
                            type="button"
                            onClick={nextImage}
                            className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition hover:bg-black/70"
                          >
                            <ChevronRight size={20} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {images.length > 1 && (
                    <div className="shrink-0 rounded-[28px] bg-white/6 p-3 sm:p-4">
                      <div className="mb-3 text-sm font-semibold text-white/90">
                        {lang === 'tr' ? 'Diğer fotoğraflar' : 'Other photos'}
                      </div>
                      <div className="flex gap-3 overflow-x-auto pb-1">
                        {images.map((url, i) => (
                          <button
                            key={url + i}
                            type="button"
                            onClick={() => setImageIdx(i)}
                            className={`shrink-0 overflow-hidden rounded-2xl border bg-black/40 p-1 transition-all ${i === imageIdx ? 'border-primary ring-2 ring-primary/40' : 'border-white/10 hover:border-white/30'}`}
                          >
                            <div className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center overflow-hidden rounded-xl bg-black">
                              <img src={url} alt="" className="max-h-full max-w-full object-contain" />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Açıklama</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{listing.description}</p>
            </div>

            {/* Ratings & Reviews */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground mb-5">
                <MessageSquare size={18} className="text-primary" />
                {lang === 'tr' ? 'Puanlar & Değerlendirmeler' : 'Ratings & Reviews'}
              </h2>

              {/* Summary */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-3">
                  <div className="text-3xl font-extrabold text-foreground">{(reviewSummary?.avg || 0).toFixed(1)}</div>
                  <div>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          className={`${i < Math.round(reviewSummary?.avg || 0) ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`}
                        />
                      ))}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {reviewSummary?.count || 0} {lang === 'tr' ? 'değerlendirme' : 'reviews'}
                    </div>
                  </div>
                </div>
                {reviewMe?.canReview === false && reviewMe?.reason === 'LOGIN_REQUIRED' && (
                  <button
                    onClick={() => (window.location.href = '/login')}
                    className="px-4 py-2 rounded-xl border border-border hover:bg-muted/30 text-sm font-semibold"
                  >
                    {lang === 'tr' ? 'Giriş yap' : 'Log in'}
                  </button>
                )}
              </div>

              {/* Existing reviews */}
              <div className="mb-6">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="text-sm font-semibold text-foreground">
                    {lang === 'tr' ? 'Yorumlar' : 'Reviews'}
                  </div>
                  <select
                    value={reviewSort}
                    onChange={(e) => setReviewSort(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-input bg-background text-foreground text-sm"
                    aria-label="review-sort"
                  >
                    <option value="newest">{lang === 'tr' ? 'En yeni' : 'Newest'}</option>
                    <option value="stars">{lang === 'tr' ? 'En yüksek puan' : 'Top rated'}</option>
                  </select>
                </div>
                {loadingReviews ? (
                  <div className="text-sm text-muted-foreground">{t.common.loading}</div>
                ) : reviews.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    {lang === 'tr' ? 'Henüz değerlendirme yok. İlk değerlendirmeyi sen yaz!' : 'No reviews yet. Be the first to review!'}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reviews.map((r) => (
                      <div key={r.id} className="rounded-xl border border-border bg-background/40 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <div className="font-semibold text-foreground text-sm">{r.buyer_name || (lang === 'tr' ? 'Kullanıcı' : 'User')}</div>
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600">
                                <BadgeCheck size={14} />
                                Verified Purchase
                              </span>
                            </div>
                            <div className="flex items-center gap-1 mt-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  size={14}
                                  className={`${i < Number(r.rating || 0) ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`}
                                />
                              ))}
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground shrink-0">
                            {r.created_at ? format(new Date(r.created_at), 'dd MMM yyyy', { locale }) : ''}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-3 whitespace-pre-wrap">{r.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add review form */}
              <form onSubmit={handleSubmitReview} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-foreground">{lang === 'tr' ? 'Yorum yaz' : 'Write a review'}</div>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => {
                      const value = i + 1
                      const active = value <= (reviewForm.rating || 0)
                      const disabled = reviewMe?.reason === 'LOGIN_REQUIRED' || !reviewMe?.canReview
                      return (
                        <button
                          key={i}
                          type="button"
                          disabled={disabled}
                          onClick={() => setReviewForm(p => ({ ...p, rating: value }))}
                          className="p-1 disabled:opacity-50"
                          aria-label={`rate-${value}`}
                          title={disabled ? (lang === 'tr' ? 'Sadece satın alan kullanıcı puan verebilir.' : 'Only verified purchasers can rate.') : ''}
                        >
                          <Star size={20} className={`${active ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`} />
                        </button>
                      )
                    })}
                  </div>
                </div>

                <textarea
                  value={reviewForm.message}
                  onChange={e => setReviewForm(p => ({ ...p, message: e.target.value }))}
                  placeholder={lang === 'tr' ? 'Bu ilan hakkında deneyimini yaz...' : 'Share your experience...'}
                  required
                  rows={4}
                  disabled={reviewMe?.reason === 'LOGIN_REQUIRED' || !reviewMe?.canReview}
                  className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors resize-none disabled:opacity-60"
                />

                {reviewMe?.reason === 'LOGIN_REQUIRED' ? (
                  <button
                    type="button"
                    onClick={() => (window.location.href = '/login')}
                    className="w-full py-3 border border-border font-semibold rounded-xl hover:bg-muted/30 transition-colors"
                  >
                    {lang === 'tr' ? 'Değerlendirme için giriş yap' : 'Log in to review'}
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={sendingMsg || !reviewMe?.canReview}
                    className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90 disabled:opacity-60 transition-opacity"
                  >
                    {sendingMsg ? t.common.loading : (lang === 'tr' ? 'Değerlendirme Gönder' : 'Post Review')}
                  </button>
                )}

                <div className="text-xs text-muted-foreground">
                  {reviewMe?.reason === 'LOGIN_REQUIRED'
                    ? (lang === 'tr' ? 'Sadece satın alan kullanıcı yorum bırakabilir.' : 'Only buyers can leave a review.')
                    : reviewMe?.canReview
                      ? (lang === 'tr' ? 'Not: Sipariş bazlı 1 yorum bırakabilirsin (duplicate engelli).' : 'Note: One review per order (duplicates prevented).')
                      : (lang === 'tr' ? 'Sadece satın alan kullanıcı yorum bırakabiliyor.' : 'Only verified purchasers can leave a review.')}
                </div>
              </form>
            </div>
          </div>

          {/* Right: Sticky sidebar */}
          <div className="space-y-4">
            {/* Price card */}
            <div className="bg-card rounded-2xl border border-border p-6 sticky top-24">
              <div className="mb-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                    ${listing.status === 'active' ? 'bg-green-500/10 text-green-600' : 'bg-muted text-muted-foreground'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${listing.status === 'active' ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                    {t.dashboard.status[listing.status] || listing.status}
                  </span>
                  <div className="flex items-center gap-1">
                    <FavoriteButton
                      listingId={listing.id}
                      size={16}
                      className="rounded-lg hover:bg-muted"
                    />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                          className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                          title={lang === 'tr' ? 'Bildir' : 'Report'}
                        >
                          <Flag size={16} />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{lang === 'tr' ? 'İlanı bildir' : 'Report listing'}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {lang === 'tr'
                              ? 'Bu ilanla ilgili sorunu kısaca yazın. Bildirim admin ekibine iletilir.'
                              : 'Briefly describe the issue. The report will be sent to the admin team.'}
                          </AlertDialogDescription>
                        </AlertDialogHeader>

                        <textarea
                          value={reportReason}
                          onChange={e => setReportReason(e.target.value)}
                          placeholder={lang === 'tr' ? 'Örn: Sahte ürün / yanıltıcı bilgi / uygunsuz içerik...' : 'e.g., scam / misleading info / inappropriate content...'}
                          rows={4}
                          className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors resize-none"
                        />

                        <AlertDialogFooter>
                          <AlertDialogCancel>{lang === 'tr' ? 'İptal' : 'Cancel'}</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleReport}
                            className="bg-destructive hover:bg-destructive/90"
                            disabled={reportLoading}
                          >
                            {reportLoading
                              ? (lang === 'tr' ? 'Gönderiliyor...' : 'Sending...')
                              : (lang === 'tr' ? 'Bildir' : 'Report')}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    <button onClick={handleShare} className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground" title={lang === 'tr' ? 'Paylaş' : 'Share'}>
                      <Share2 size={16} />
                    </button>
                  </div>
                </div>
                <h1 className="text-xl font-bold text-foreground leading-tight mb-3">{listing.title}</h1>
                <div className="text-3xl font-extrabold text-primary">
                  {new Intl.NumberFormat('tr-TR').format(listing.price)} {t.common.currency}
                </div>
              </div>

              {/* Purchase */}
              <div className="mb-5 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{lang === 'tr' ? 'Stok' : 'Stock'}</span>
                  <span className={`font-bold ${Number(listing.stock) > 0 ? 'text-foreground' : 'text-destructive'}`}>{Number(listing.stock) || 0}</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    onClick={() => {
                      if ((Number(listing.stock) || 0) <= 0) return
                      addItem(listing, 1)
                      toast.success(lang === 'tr' ? 'Sepete eklendi' : 'Added to cart')
                    }}
                    disabled={(Number(listing.stock) || 0) <= 0}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-extrabold text-white disabled:opacity-50"
                    style={{ background: 'var(--brand-orange)' }}
                  >
                    <ShoppingCart size={18} />
                    {lang === 'tr' ? 'Sepete Ekle' : 'Add to Cart'}
                  </button>

                  <button
                    onClick={() => {
                      if ((Number(listing.stock) || 0) <= 0) return
                      addItem(listing, 1)
                      window.location.href = '/cart'
                    }}
                    disabled={(Number(listing.stock) || 0) <= 0}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-extrabold border border-border hover:bg-muted/30 disabled:opacity-50"
                  >
                    <CreditCard size={18} />
                    {lang === 'tr' ? 'Hemen Satın Al' : 'Buy Now'}
                  </button>

                  {/* Large "Favori" pill removed as requested (keep icon button in header) */}
                </div>
                {(Number(listing.stock) || 0) <= 0 && (
                  <div className="text-xs text-destructive">{lang === 'tr' ? 'Stokta yok' : 'Out of stock'}</div>
                )}
              </div>

              <div className="space-y-2.5 mb-5">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Tag size={14} className="shrink-0" />
                  <span>{t.categories[listing.category] || listing.category}</span>
                </div>
                {listing.location && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin size={14} className="shrink-0" />
                    <span>{listing.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar size={14} className="shrink-0" />
                  <span>{formattedDate}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Eye size={14} className="shrink-0" />
                  <span>{listing.views} {t.detail.views}</span>
                </div>
              </div>

              {/* Seller info */}
              <div className="border-t border-border pt-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  {t.detail.sellerInfo}
                </h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {listing.seller_name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{listing.seller_name}</p>
                    {listing.seller_phone && (
                      <p className="text-xs text-muted-foreground">{listing.seller_phone}</p>
                    )}
                  </div>
                </div>

                {!isOwner && (
                  <div className="mt-4 space-y-3">
                    <button
                      onClick={startChat}
                      className="w-full h-11 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-95"
                      style={{ background: 'var(--brand-orange)', color: '#fff' }}
                    >
                      <MessageSquare size={18} /> {lang === 'tr' ? 'Satıcıyla sohbet' : 'Chat with seller'}
                    </button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                          className="w-full h-11 rounded-xl font-semibold flex items-center justify-center gap-2 border border-border bg-background hover:bg-muted transition-colors"
                        >
                          {lang === 'tr' ? 'Teklif ver' : 'Make an offer'}
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{lang === 'tr' ? 'Teklif ver' : 'Make an offer'}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {lang === 'tr'
                              ? 'Satıcıya teklif gönder. Teklif mesajlar kutusuna düşer ve sohbet başlayabilir.'
                              : 'Send an offer to the seller. It will appear in messages and you can continue chatting.'}
                          </AlertDialogDescription>
                        </AlertDialogHeader>

                        <div className="mt-3 flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={offerAmount}
                            onChange={e => setOfferAmount(e.target.value)}
                            placeholder={lang === 'tr' ? 'Tutar (₺)' : 'Amount (₺)'}
                            className="flex-1 h-10 rounded-lg border border-border bg-background px-3 text-sm"
                          />
                        </div>

                        <div className="mt-2 text-[11px] text-muted-foreground">
                          {lang === 'tr'
                            ? 'İpucu: Ödemeyi uygulama dışına taşımayın; mesajları kayıtlı tutun.'
                            : 'Tip: Avoid off-platform payments; keep messages documented.'}
                        </div>

                        <AlertDialogFooter>
                          <AlertDialogCancel>{lang === 'tr' ? 'Vazgeç' : 'Cancel'}</AlertDialogCancel>
                          <AlertDialogAction onClick={makeOffer} disabled={offerLoading}>
                            {offerLoading ? (lang === 'tr' ? 'Gönderiliyor…' : 'Sending…') : (lang === 'tr' ? 'Gönder' : 'Send')}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Related listings */}
        {related.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-foreground mb-6">{t.detail.similarListings}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {related.map(item => (
                <ListingCard key={item.id} listing={item} />
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
