'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, ArrowRight, ImagePlus, X, Star, Loader2 } from 'lucide-react'
import { useLanguage } from './language-provider'
import { CATEGORIES } from '@/lib/i18n'

const MAX_IMAGES = 5
const MAX_RESOLUTION = 1600
const JPEG_QUALITY = 0.84

async function resizeImageFile(file) {
  if (!file?.type?.startsWith('image/')) return file

  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

  const img = await new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = dataUrl
  })

  const longestSide = Math.max(img.width, img.height)
  if (longestSide <= MAX_RESOLUTION && file.size <= 1.5 * 1024 * 1024) {
    return file
  }

  const scale = Math.min(1, MAX_RESOLUTION / longestSide)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(img.width * scale)
  canvas.height = Math.round(img.height * scale)

  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

  const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
  const blob = await new Promise((resolve) => {
    canvas.toBlob(resolve, outputType, outputType === 'image/png' ? undefined : JPEG_QUALITY)
  })

  if (!blob) return file

  const nextName = file.name.replace(/\.[^.]+$/, outputType === 'image/png' ? '.png' : '.jpg')
  return new File([blob], nextName || file.name, { type: outputType })
}

// ✅ ListingForm DIŞINA taşındı (focus sorunu çözülür)
const Field = ({ label, error, children }) => (
  <div>
    <label className="block text-sm font-semibold text-foreground mb-2">{label}</label>
    {children}
    {error && <p className="text-destructive text-xs mt-1.5">{error}</p>}
  </div>
)

export default function ListingForm({ initialData = null, listingId = null }) {
  const { t, lang } = useLanguage()
  const router = useRouter()
  const isEdit = !!listingId

  const [form, setForm] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    price: initialData?.price?.toString() || '',
    stock: (initialData?.stock ?? '').toString(),
    category: initialData?.category || '',
    location: initialData?.location || '',
  })
  const [images, setImages] = useState(initialData?.images || [])
  const [coverIndex, setCoverIndex] = useState(0)
  const [errors, setErrors] = useState({})
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const setField = (key, val) => {
    setForm(p => ({ ...p, [key]: val }))
    setErrors(p => ({ ...p, [key]: '' }))
  }

  const validate = () => {
    const errs = {}
    if (!form.title.trim()) errs.title = t.form.errors.titleRequired
    else if (form.title.trim().length < 5) errs.title = t.form.errors.titleMin
    if (!form.description.trim()) errs.description = t.form.errors.descriptionRequired
    else if (form.description.trim().length < 20) errs.description = t.form.errors.descriptionMin
    if (!form.price) errs.price = t.form.errors.priceRequired
    else if (isNaN(Number(form.price)) || Number(form.price) < 0) errs.price = t.form.errors.priceInvalid
    if (form.stock === '' || form.stock === null || typeof form.stock === 'undefined') errs.stock = (lang === 'tr' ? 'Stok zorunlu.' : 'Stock is required.')
    else if (isNaN(Number(form.stock)) || Number(form.stock) < 0) errs.stock = (lang === 'tr' ? 'Stok geçersiz.' : 'Invalid stock.')
    if (!form.category) errs.category = t.form.errors.categoryRequired
    if (!form.location.trim()) errs.location = t.form.errors.locationRequired
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleImagePick = async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    const remaining = MAX_IMAGES - images.length
    if (remaining <= 0) {
      toast.error(lang === 'tr' ? `En fazla ${MAX_IMAGES} görsel yükleyebilirsiniz.` : `Max ${MAX_IMAGES} images allowed.`)
      return
    }
    const toUpload = files.slice(0, remaining)
    setUploading(true)
    try {
      const uploaded = await Promise.all(
        toUpload.map(async (file) => {
          const optimizedFile = await resizeImageFile(file)
          const fd = new FormData()
          fd.append('file', optimizedFile)
          const res = await fetch('/api/upload', { method: 'POST', body: fd })
          if (!res.ok) throw new Error()
          const data = await res.json()
          return data.url
        })
      )
      setImages(prev => [...prev, ...uploaded])
    } catch {
      toast.error(lang === 'tr' ? 'Görsel yüklenemedi.' : 'Image upload failed.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const removeImage = (i) => {
    setImages(prev => prev.filter((_, idx) => idx !== i))
    if (coverIndex >= i && coverIndex > 0) setCoverIndex(coverIndex - 1)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        stock: Math.floor(Number(form.stock) || 0),
        images,
        coverImage: images[coverIndex] || null,
        cover_image: images[coverIndex] || null,
      }
      const res = await fetch(
        isEdit ? `/api/listings/${listingId}` : '/api/listings',
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      )
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'error')
      }
      toast.success(isEdit ? t.form.success.updated : t.form.success.created)
      router.push('/dashboard')
    } catch (err) {
      toast.error(
        err.message === 'Unauthorized'
          ? (lang === 'tr' ? 'Giriş yapmanız gerekiyor.' : 'Please log in.')
          : t.common.error
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Back button */}
      <button
        type="button"
        onClick={() => router.push('/dashboard')}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        {t.common.back}
      </button>

      {/* Page title */}
      <div className="mb-8">
        <p className="text-primary text-xs font-bold uppercase tracking-[0.18em] mb-1">
          {isEdit ? t.dashboard.editListing : t.dashboard.addListing}
        </p>
        <h1 className="text-3xl font-extrabold text-foreground">
          {isEdit ? t.dashboard.editListing : (lang === 'tr' ? 'Yeni İlan Oluştur' : 'Create New Listing')}
        </h1>
      </div>

      <div className="space-y-6">

        {/* Title */}
        <Field label={t.form.title} error={errors.title}>
          <input
            type="text"
            value={form.title}
            onChange={e => setField('title', e.target.value)}
            placeholder={t.form.titlePlaceholder}
            className={`w-full px-4 py-3 rounded-xl border bg-background text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors ${errors.title ? 'border-destructive' : 'border-input'}`}
          />
        </Field>

        {/* Description */}
        <Field label={t.form.description} error={errors.description}>
          <textarea
            value={form.description}
            onChange={e => setField('description', e.target.value)}
            placeholder={t.form.descriptionPlaceholder}
            rows={5}
            className={`w-full px-4 py-3 rounded-xl border bg-background text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors resize-none ${errors.description ? 'border-destructive' : 'border-input'}`}
          />
        </Field>

        {/* Price + Stock + Category row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label={t.form.price} error={errors.price}>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">₺</span>
              <input
                type="number"
                min="0"
                step="1"
                value={form.price}
                onChange={e => setField('price', e.target.value)}
                placeholder={t.form.pricePlaceholder}
                className={`w-full pl-9 pr-4 py-3 rounded-xl border bg-background text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors ${errors.price ? 'border-destructive' : 'border-input'}`}
              />
            </div>
          </Field>

          <Field label={lang === 'tr' ? 'Stok' : 'Stock'} error={errors.stock}>
            <input
              type="number"
              min="0"
              step="1"
              value={form.stock}
              onChange={e => setField('stock', e.target.value)}
              placeholder={lang === 'tr' ? 'Örn: 10' : 'e.g. 10'}
              className={`w-full px-4 py-3 rounded-xl border bg-background text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors ${errors.stock ? 'border-destructive' : 'border-input'}`}
            />
          </Field>

          <Field label={t.form.category} error={errors.category}>
            <select
              value={form.category}
              onChange={e => setField('category', e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border bg-background text-foreground outline-none focus:border-primary transition-colors appearance-none cursor-pointer ${errors.category ? 'border-destructive' : 'border-input'}`}
            >
              <option value="">{lang === 'tr' ? 'Kategori seçin...' : 'Select category...'}</option>
              {CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>{t.categories[cat.id]}</option>
              ))}
            </select>
          </Field>
        </div>

        {/* Location */}
        <Field label={t.form.location} error={errors.location}>
          <input
            type="text"
            value={form.location}
            onChange={e => setField('location', e.target.value)}
            placeholder={t.form.locationPlaceholder}
            className={`w-full px-4 py-3 rounded-xl border bg-background text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors ${errors.location ? 'border-destructive' : 'border-input'}`}
          />
        </Field>

        {/* Images */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-1">{t.form.images}</label>
          <p className="text-xs text-muted-foreground mb-3">{t.form.imagesHint}</p>

          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {images.map((url, i) => (
              <div key={url + i} className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-border/70 bg-muted/30 shadow-sm group">
                <img src={url} alt="" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
                {/* Cover badge */}
                {i === coverIndex && (
                  <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-primary text-white text-[10px] font-bold rounded-full">
                    {lang === 'tr' ? 'Kapak' : 'Cover'}
                  </div>
                )}
                {/* Overlay buttons */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {i !== coverIndex && (
                    <button
                      type="button"
                      onClick={() => setCoverIndex(i)}
                      className="p-1.5 rounded-full bg-primary text-white hover:scale-110 transition-transform"
                      title={t.form.setCover}
                    >
                      <Star size={13} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="p-1.5 rounded-full bg-destructive text-white hover:scale-110 transition-transform"
                    title={t.form.removeImage}
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>
            ))}

            {/* Add image slot */}
            {images.length < MAX_IMAGES && (
              <label className="aspect-[4/3] rounded-2xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/30 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all group">
                {uploading ? (
                  <Loader2 size={22} className="text-primary animate-spin" />
                ) : (
                  <>
                    <ImagePlus size={22} className="text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors text-center px-1">
                      {lang === 'tr' ? 'Ekle' : 'Add'}
                    </span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImagePick}
                  disabled={uploading}
                />
              </label>
            )}
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="flex-1 sm:flex-none px-6 py-3 border border-border text-foreground font-medium rounded-xl hover:bg-muted transition-colors text-sm"
          >
            {t.form.cancel}
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3 bg-primary text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-60 transition-all duration-200 shadow-lg shadow-primary/25 text-sm"
          >
            {submitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                {isEdit ? t.form.update : t.form.submit}
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  )
}