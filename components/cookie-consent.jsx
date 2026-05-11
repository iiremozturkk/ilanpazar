'use client'

import { useEffect, useMemo, useState } from 'react'
import { useLanguage } from '@/components/language-provider'

const STORAGE_KEY = 'ilanpazar_cookie_consent'

export default function CookieConsent() {
  const { lang } = useLanguage()
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState('simple') // simple | manage
  const [analytics, setAnalytics] = useState(true)
  const [personalization, setPersonalization] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) setOpen(true)
  }, [])

  const copy = useMemo(() => {
    if (lang === 'tr') {
      return {
        title: 'Gizliliğiniz bizim için önemli',
        desc: 'Kullanıcı deneyimini geliştirmek, site trafiğini analiz etmek ve içerikleri kişiselleştirmek için çerezleri kullanıyoruz. Hangi çerezleri kabul edeceğinizi seçebilirsiniz.',
        acceptAll: 'Tümünü kabul et',
        necessary: 'Sadece gerekli',
        manage: 'Yönet',
        manageTitle: 'Çerez tercihleri',
        analytics: 'Analitik',
        personalization: 'Kişiselleştirme',
        save: 'Kaydet',
        back: 'Geri',
      }
    }
    return {
      title: 'Your privacy matters',
      desc: 'We use cookies to improve your experience, analyze website traffic, and personalize content. You can choose which cookies to accept.',
      acceptAll: 'Accept all',
      necessary: 'Only necessary',
      manage: 'Manage',
      manageTitle: 'Cookie preferences',
      analytics: 'Analytics',
      personalization: 'Personalization',
      save: 'Save',
      back: 'Back',
    }
  }, [lang])

  const persist = (payload) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...payload, savedAt: Date.now() }))
    setOpen(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[90] pointer-events-none">
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-[min(880px,92vw)] pointer-events-auto">
        <div className="rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
          <div className="p-5 md:p-6">
            <div className="min-w-0">
              <div className="text-base font-semibold text-foreground">{mode === 'manage' ? copy.manageTitle : copy.title}</div>
              <div className="text-sm text-muted-foreground mt-1">
                {copy.desc}
              </div>

              {mode === 'manage' && (
                <div className="mt-4 grid gap-3">
                  <label className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background px-4 py-3">
                    <div>
                      <div className="text-sm font-medium text-foreground">{copy.analytics}</div>
                      <div className="text-xs text-muted-foreground">{lang === 'tr' ? 'Trafik ve performans ölçümü.' : 'Traffic and performance measurement.'}</div>
                    </div>
                    <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} className="accent-[var(--brand-orange)]" />
                  </label>

                  <label className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background px-4 py-3">
                    <div>
                      <div className="text-sm font-medium text-foreground">{copy.personalization}</div>
                      <div className="text-xs text-muted-foreground">{lang === 'tr' ? 'İçerik önerileri ve kişiselleştirme.' : 'Recommendations and personalization.'}</div>
                    </div>
                    <input type="checkbox" checked={personalization} onChange={(e) => setPersonalization(e.target.checked)} className="accent-[var(--brand-orange)]" />
                  </label>
                </div>
              )}
            </div>

            {/* Buttons (bottom, side-by-side) */}
            <div className="mt-5 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-end">
              {mode === 'manage' ? (
                <>
                  <button
                    type="button"
                    onClick={() => setMode('simple')}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl border border-border bg-background text-sm font-semibold"
                  >
                    {copy.back}
                  </button>
                  <button
                    type="button"
                    onClick={() => persist({ necessary: true, analytics, personalization })}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
                  >
                    {copy.save}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setMode('manage')}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl border border-border bg-background text-sm font-semibold"
                  >
                    {copy.manage}
                  </button>
                  <button
                    type="button"
                    onClick={() => persist({ necessary: true, analytics: false, personalization: false })}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl border border-border bg-background text-sm font-semibold"
                  >
                    {copy.necessary}
                  </button>
                  <button
                    type="button"
                    onClick={() => persist({ necessary: true, analytics: true, personalization: true })}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
                  >
                    {copy.acceptAll}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
