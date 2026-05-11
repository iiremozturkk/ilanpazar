'use client'

import { Heart } from 'lucide-react'
import { useFavorites } from '@/components/favorites-provider'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'
import { useLanguage } from '@/components/language-provider'

export default function FavoriteButton({ listingId, size = 18, className = '', variant = 'icon' }) {
  const { user } = useAuth()
  const fav = useFavorites()
  const { lang } = useLanguage()
  const active = fav.isFavorite(listingId)

  const onClick = async (e) => {
    e?.preventDefault?.()
    e?.stopPropagation?.()

    const res = await fav.toggle(listingId)
    if (res?.unauthorized) {
      toast(lang === 'tr' ? 'Favorilere eklemek için giriş yapmalısınız' : 'Please login to favorite')
      return
    }
    if (!res?.ok) {
      toast(lang === 'tr' ? 'İşlem başarısız' : 'Action failed')
      return
    }
  }

  return (
    <button
      type="button"
      aria-label={active ? 'Favoriden çıkar' : 'Favorilere ekle'}
      onClick={onClick}
      className={
        `inline-flex items-center justify-center rounded-full text-foreground dark:text-white transition-transform duration-150 active:scale-95 hover:scale-110 ${className}`
      }
      style={{
        background: variant === 'pill' ? 'color-mix(in oklab, var(--card) 85%, transparent)' : 'transparent',
        border: variant === 'pill' ? '1px solid color-mix(in oklab, var(--border) 70%, transparent)' : 'none',
        padding: variant === 'pill' ? '10px 14px' : '8px',
      }}
    >
      <Heart
        size={size}
        style={{
          color: active ? 'var(--brand-orange)' : 'currentColor',
          fill: active ? 'var(--brand-orange)' : 'transparent',
          strokeWidth: 2.2,
          transition: 'transform 0.15s ease, fill 0.15s ease, color 0.15s ease',
          transform: active ? 'scale(1.05)' : 'scale(1)',
        }}
      />
      {variant === 'pill' && (
        <span className="ml-2 text-sm font-extrabold">
          {active ? (lang === 'tr' ? 'Favoride' : 'Saved') : (lang === 'tr' ? 'Favori' : 'Save')}
        </span>
      )}
    </button>
  )
}
