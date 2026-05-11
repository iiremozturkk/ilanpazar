'use client'

import Navbar from '@/components/navbar'
import Footer from '@/components/footer'
import { useLanguage } from '@/components/language-provider'

export default function StaticPageShell({ title, subtitle, children }) {
  const { lang } = useLanguage()

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <header className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight mb-3">
            {title}
          </h1>
          {subtitle ? (
            <p className="text-muted-foreground text-base sm:text-lg max-w-2xl">
              {subtitle}
            </p>
          ) : null}
        </header>

        <section className="bg-card border border-border rounded-2xl p-6 sm:p-8 leading-relaxed text-foreground">
          {children}
        </section>

        <div className="mt-10 text-xs text-muted-foreground">
          {lang === 'tr'
            ? 'Not: Bu sayfalar bilgilendirme amaçlıdır. Resmi sözleşme metinleri için hukuk danışmanınıza başvurun.'
            : 'Note: These pages are informational. For legally binding terms, consult your legal advisor.'}
        </div>
      </main>
      <Footer />
    </div>
  )
}
