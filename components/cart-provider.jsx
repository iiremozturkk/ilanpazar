'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const CartContext = createContext(null)

const STORAGE_KEY = 'ilanpazar_cart_v1'

function safeParse(json, fallback) {
  try {
    const v = JSON.parse(json)
    return v ?? fallback
  } catch {
    return fallback
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null
    const initial = raw ? safeParse(raw, []) : []
    setItems(Array.isArray(initial) ? initial : [])
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items, hydrated])

  const count = useMemo(() => items.reduce((a, it) => a + (it.quantity || 0), 0), [items])
  const subtotal = useMemo(() => items.reduce((a, it) => a + (Number(it.price) || 0) * (it.quantity || 0), 0), [items])

  const api = useMemo(() => ({
    hydrated,
    items,
    count,
    subtotal,
    addItem: (listing, qty = 1) => {
      if (!listing?.id) return
      const maxStock = Number.isFinite(Number(listing.stock)) ? Number(listing.stock) : 0
      setItems(prev => {
        const existing = prev.find(p => p.listingId === listing.id)
        if (existing) {
          const nextQty = Math.min((existing.quantity || 0) + qty, maxStock || 999999)
          return prev.map(p => p.listingId === listing.id ? { ...p, quantity: nextQty, stock: maxStock } : p)
        }
        return [...prev, {
          listingId: listing.id,
          title: listing.title,
          price: listing.price,
          cover_image: listing.cover_image || listing.coverImage || null,
          stock: maxStock,
          quantity: Math.min(qty, maxStock || qty),
        }]
      })
    },
    removeItem: (listingId) => setItems(prev => prev.filter(p => p.listingId !== listingId)),
    setQuantity: (listingId, quantity) => {
      const q = Math.max(1, Math.floor(Number(quantity) || 1))
      setItems(prev => prev.map(p => {
        if (p.listingId !== listingId) return p
        const maxStock = Number.isFinite(Number(p.stock)) ? Number(p.stock) : 999999
        return { ...p, quantity: Math.min(q, maxStock) }
      }))
    },
    clear: () => setItems([]),
    syncStock: (listingId, stock) => {
      const s = Math.max(0, Math.floor(Number(stock) || 0))
      setItems(prev => prev.map(p => p.listingId === listingId ? { ...p, stock: s, quantity: Math.min(p.quantity || 1, s || 1) } : p))
    },
  }), [items, count, subtotal, hydrated])

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
