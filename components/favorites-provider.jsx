'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'

const FavoritesContext = createContext(null)

export function FavoritesProvider({ children }) {
  const { user, loading } = useAuth()
  const [ids, setIds] = useState([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    // When auth state changes, refetch favorites.
    if (loading) return
    if (!user) {
      setIds([])
      setHydrated(true)
      return
    }
    let cancelled = false
    fetch('/api/favorites')
      .then(r => r.json())
      .then(data => {
        if (cancelled) return
        const next = Array.isArray(data?.ids) ? data.ids : []
        setIds(next)
      })
      .catch(() => {
        if (cancelled) return
        setIds([])
      })
      .finally(() => {
        if (cancelled) return
        setHydrated(true)
      })

    return () => { cancelled = true }
  }, [user, loading])

  const api = useMemo(() => {
    const set = new Set(ids.map(Number))

    return {
      hydrated,
      ids,
      count: ids.length,
      isFavorite: (listingId) => set.has(Number(listingId)),
      toggle: async (listingId) => {
        const id = Number(listingId)
        if (!id) return { ok: false }
        if (!user) return { ok: false, unauthorized: true }

        // Optimistic update
        const was = set.has(id)
        setIds(prev => {
          const s = new Set(prev.map(Number))
          if (was) s.delete(id)
          else s.add(id)
          return Array.from(s)
        })

        try {
          const res = await fetch('/api/favorites', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ listingId: id }),
          })
          const data = await res.json().catch(() => ({}))
          if (!res.ok) {
            // rollback
            setIds(prev => {
              const s = new Set(prev.map(Number))
              if (was) s.add(id)
              else s.delete(id)
              return Array.from(s)
            })
            return { ok: false, error: data?.error || 'Request failed', status: res.status }
          }
          const fav = !!data?.favorite
          setIds(prev => {
            const s = new Set(prev.map(Number))
            if (fav) s.add(id)
            else s.delete(id)
            return Array.from(s)
          })
          return { ok: true, favorite: fav }
        } catch (e) {
          // rollback
          setIds(prev => {
            const s = new Set(prev.map(Number))
            if (was) s.add(id)
            else s.delete(id)
            return Array.from(s)
          })
          return { ok: false, error: e?.message || 'Network error' }
        }
      },
      refresh: async () => {
        if (!user) return
        const res = await fetch('/api/favorites')
        const data = await res.json().catch(() => ({}))
        const next = Array.isArray(data?.ids) ? data.ids : []
        setIds(next)
      },
    }
  }, [ids, hydrated, user])

  return <FavoritesContext.Provider value={api}>{children}</FavoritesContext.Provider>
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext)
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider')
  return ctx
}
