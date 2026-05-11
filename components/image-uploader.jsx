'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, X, Star } from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from './language-provider'

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
const MAX_SIZE = 5 * 1024 * 1024

export default function ImageUploader({ value = [], onChange, coverIndex = 0, onCoverChange }) {
  const { t } = useLanguage()
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef(null)

  const uploadFile = async (file) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Sadece JPG, PNG ve WEBP desteklenir')
      return null
    }
    if (file.size > MAX_SIZE) {
      toast.error('Dosya boyutu en fazla 5MB olabilir')
      return null
    }

    const optimizedFile = await resizeImageFile(file)

    const fd = new FormData()
    fd.append('file', optimizedFile)
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error || 'Yükleme başarısız'); return null }
    return data.url
  }

  const handleFiles = useCallback(async (files) => {
    const remaining = MAX_IMAGES - value.length
    if (remaining <= 0) {
      toast.error(`En fazla ${MAX_IMAGES} görsel yükleyebilirsiniz`)
      return
    }

    const toProcess = Array.from(files).slice(0, remaining)
    setUploading(true)

    const urls = []
    for (const file of toProcess) {
      const url = await uploadFile(file)
      if (url) urls.push(url)
    }

    if (urls.length > 0) {
      onChange([...value, ...urls])
    }
    setUploading(false)
  }, [value, onChange])

  const onDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  const removeImage = (idx) => {
    const newImages = value.filter((_, i) => i !== idx)
    onChange(newImages)
    if (coverIndex >= newImages.length && onCoverChange) {
      onCoverChange(0)
    } else if (idx === coverIndex && onCoverChange) {
      onCoverChange(0)
    }
  }

  return (
    <div className="space-y-3">
      {/* Upload area */}
      {value.length < MAX_IMAGES && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200
            ${dragging
              ? 'border-primary bg-primary/5 scale-[1.01]'
              : 'border-border hover:border-primary/50 hover:bg-muted/50'
            }
            ${uploading ? 'pointer-events-none opacity-60' : ''}
          `}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <div className="flex flex-col items-center gap-3">
            <div className={`w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center transition-transform ${dragging ? 'scale-110' : ''}`}>
              <Upload size={22} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {uploading ? t.common.loading : t.form.dragDrop}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t.form.imagesHint}
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{value.length}/{MAX_IMAGES}</span>
            </div>
          </div>
        </div>
      )}

      {/* Preview grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {value.map((url, idx) => (
            <div key={url} className="relative group aspect-[4/3] rounded-2xl overflow-hidden border border-border/70 bg-muted/30 shadow-sm transition-all">
              <img src={url} alt={`image-${idx}`} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />

              {/* Overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />

              {/* Cover badge */}
              {idx === coverIndex && (
                <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1">
                  <Star size={8} fill="currentColor" />
                  Kapak
                </div>
              )}

              {/* Actions */}
              <div className="absolute inset-0 flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                {idx !== coverIndex && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onCoverChange?.(idx) }}
                    className="p-1.5 bg-white/90 rounded-lg text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                    title={t.form.setCover}
                  >
                    <Star size={13} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeImage(idx) }}
                  className="p-1.5 bg-white/90 rounded-lg text-destructive hover:bg-destructive hover:text-white transition-colors"
                  title={t.form.removeImage}
                >
                  <X size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
