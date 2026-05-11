'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/navbar'
import Footer from '@/components/footer'
import ListingCard from '@/components/listing-card'
import { useLanguage } from '@/components/language-provider'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'

export default function FavoritesPage() {
  const { lang } = useLanguage()
  const { user, loading } = useAuth()
  const [items, setItems] = useState([])
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    if (loading) return
    if (!user) {
      setItems([])
      setFetching(false)
      return
    }
    let cancelled = false
    setFetching(true)
    fetch('/api/favorites')
      .then(r => r.json())
      .then(data => {
        if (cancelled) return
        setItems(Array.isArray(data?.listings) ? data.listings : [])
      })
      .catch(() => {
        if (cancelled) return
        toast(lang === 'tr' ? 'Favoriler yüklenemedi' : 'Failed to load favorites')
        setItems([])
      })
      .finally(() => {
        if (cancelled) return
        setFetching(false)
      })
    return () => { cancelled = true }
  }, [user, loading, lang])

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-extrabold mb-6">
            {lang === 'tr' ? 'Favoriler' : 'Favorites'}
          </h1>

          {!user && !loading && (
            <div className="bg-card border border-border rounded-2xl p-6 text-muted-foreground">
              {lang === 'tr' ? 'Favorileri görmek için giriş yapın.' : 'Please login to see your favorites.'}
            </div>
          )}

          {user && (
            fetching ? (
              <div className="text-muted-foreground">{lang === 'tr' ? 'Yükleniyor…' : 'Loading…'}</div>
            ) : items.length === 0 ? (
              <div className="bg-card border border-border rounded-2xl p-6 text-muted-foreground">
                {lang === 'tr' ? 'Henüz favoriniz yok.' : 'No favorites yet.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map(it => (
                  <ListingCard key={it.id} listing={it} />
                ))}
              </div>
            )
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
