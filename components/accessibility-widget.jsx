'use client'

import { useEffect, useMemo, useState } from 'react'
import { Accessibility, RotateCcw } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'

const STORAGE_KEY = 'ilanpazar_a11y'

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n))
}

export default function AccessibilityWidget() {
  const { lang } = useLanguage()
  const [open, setOpen] = useState(false)
  const [scale, setScale] = useState(1)
  const [contrast, setContrast] = useState(false)

  const copy = useMemo(() => {
    if (lang === 'tr') {
      return {
        title: 'Erişilebilirlik',
        desc: 'Okunabilirlik için yazı boyutunu ve kontrastı ayarlayın.',
        fontSize: 'Yazı boyutu',
        highContrast: 'Yüksek kontrast',
        reset: 'Sıfırla',
        explain: 'Açıklama',
        bullets: ['Klavye odak vurgusu', 'Ana içeriğe atla', 'Yüksek renk kontrastı (üstten aç/kapat)'],
        on: 'Açık',
        off: 'Kapalı',
      }
    }
    return {
      title: 'Accessibility',
      desc: 'Adjust font size and contrast for better readability.',
      fontSize: 'Font size',
      highContrast: 'High contrast',
      reset: 'Reset',
      explain: 'Info',
      bullets: ['Keyboard focus highlight', 'Skip to main content', 'Good color contrast (toggle above)'],
      on: 'On',
      off: 'Off',
    }
  }, [lang])

  const apply = (nextScale, nextContrast) => {
    document.documentElement.style.setProperty('--a11y-font-scale', String(nextScale))
    document.documentElement.classList.toggle('a11y-high-contrast', !!nextContrast)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ scale: nextScale, contrast: !!nextContrast }))
  }

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) {
      apply(1, false)
      return
    }
    try {
      const v = JSON.parse(saved)
      const s = clamp(Number(v?.scale) || 1, 0.9, 1.25)
      const c = !!v?.contrast
      setScale(s)
      setContrast(c)
      apply(s, c)
    } catch {
      apply(1, false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const inc = () => {
    const s = clamp(Number((scale + 0.05).toFixed(2)), 0.9, 1.25)
    setScale(s)
    apply(s, contrast)
  }
  const dec = () => {
    const s = clamp(Number((scale - 0.05).toFixed(2)), 0.9, 1.25)
    setScale(s)
    apply(s, contrast)
  }
  const toggleContrast = () => {
    const c = !contrast
    setContrast(c)
    apply(scale, c)
  }
  const reset = () => {
    setScale(1)
    setContrast(false)
    apply(1, false)
  }

  return (
    <div className="fixed bottom-5 left-5 z-[85]">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="h-11 w-11 rounded-2xl border border-border bg-card shadow-lg flex items-center justify-center hover:shadow-xl transition"
        aria-label={copy.title}
      >
        <Accessibility className="h-5 w-5" />
      </button>

      {open && (
        <div className="mt-3 w-[320px] max-w-[86vw] rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-scale-in">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-foreground">{copy.title}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{copy.desc}</div>
              </div>
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center gap-2 text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-border bg-background hover:bg-black/5 dark:hover:bg-white/5"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                {copy.reset}
              </button>
            </div>

            <div className="mt-4">
              <div className="text-xs font-semibold text-muted-foreground mb-2">{copy.fontSize} <span className="float-right">{Math.round(scale * 100)}%</span></div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={dec} className="h-10 w-12 rounded-xl border border-border bg-background text-sm font-bold">A-</button>
                <button type="button" onClick={inc} className="h-10 w-12 rounded-xl border border-border bg-background text-sm font-bold">A+</button>
                <div className="flex-1" />
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-border bg-background px-4 py-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-foreground">{copy.highContrast}</div>
                <div className="text-xs text-muted-foreground">{lang === 'tr' ? 'Okunabilirliği artırır.' : 'Improves readability.'}</div>
              </div>
              <button
                type="button"
                onClick={toggleContrast}
                className="h-8 px-3 rounded-xl border border-border bg-card text-xs font-bold"
              >
                {contrast ? copy.on : copy.off}
              </button>
            </div>

            <div className="mt-4">
              <div className="text-xs font-semibold text-muted-foreground mb-2">{copy.explain}</div>
              <ul className="text-xs text-muted-foreground list-disc pl-5 space-y-1">
                {copy.bullets.map((b) => <li key={b}>{b}</li>)}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
