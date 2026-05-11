'use client'

import { useState, useEffect } from 'react'
import { ArrowUp } from 'lucide-react'

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handler = () => setVisible(window.scrollY > 400)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const scrollUp = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <button
      onClick={scrollUp}
      aria-label="Sayfanın başına git"
      // AI Chat widget sits at bottom-right. Keep this button *above* it so they don't overlap.
      className="fixed bottom-24 right-7 z-50 group"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.75)',
        pointerEvents: visible ? 'auto' : 'none',
        transition: 'opacity 0.35s cubic-bezier(0.34,1.56,0.64,1), transform 0.35s cubic-bezier(0.34,1.56,0.64,1)',
      }}
    >
      {/* Animated pulse rings */}
      <span
        className="absolute inset-0 rounded-full"
        style={{
          background: 'var(--brand-orange)',
          animation: visible ? 'pulse-ring 2s cubic-bezier(0.215,0.61,0.355,1) infinite' : 'none',
          opacity: 0.35,
        }}
      />
      <span
        className="absolute inset-0 rounded-full"
        style={{
          background: 'var(--brand-orange)',
          animation: visible ? 'pulse-ring 2s cubic-bezier(0.215,0.61,0.355,1) 0.5s infinite' : 'none',
          opacity: 0.2,
        }}
      />
      {/* Main button */}
      <span
        className="relative flex items-center justify-center w-12 h-12 rounded-full text-white transition-all duration-200 group-hover:scale-110 group-active:scale-95"
        style={{
          background: 'var(--brand-orange)',
          boxShadow: '0 8px 28px rgba(249,115,22,0.5)',
        }}
      >
        <ArrowUp
          size={20}
          strokeWidth={2.5}
          className="transition-transform duration-200 group-hover:-translate-y-0.5"
        />
      </span>
    </button>
  )
}
