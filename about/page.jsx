'use client'

import StaticPageShell from '@/components/static-page-shell'
import { useLanguage } from '@/components/language-provider'

export default function AboutPage() {
  const { lang } = useLanguage()

  const title = lang === 'tr' ? 'Hakkımızda' : 'About'
  const subtitle =
    lang === 'tr'
      ? 'ilanpazar, alıcılarla satıcıları güvenli ve hızlı şekilde buluşturan modern bir ilan platformudur.'
      : 'ilanpazar is a modern marketplace that connects buyers and sellers quickly and safely.'

  return (
    <StaticPageShell title={title} subtitle={subtitle}>
      <div className="space-y-6 text-sm sm:text-base">
        <p>
          {lang === 'tr'
            ? 'Amacımız; ilan vermeyi saniyeler içine indirmek, aradığını kolayca bulmanı sağlamak ve kullanıcılar için şeffaf bir deneyim sunmak.'
            : 'Our goal is to make posting ads take seconds, help you find what you need easily, and deliver a transparent experience.'}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[{
            t: lang === 'tr' ? 'Hız' : 'Speed',
            d: lang === 'tr' ? 'Kolay ilan oluşturma ve hızlı yayın.' : 'Easy creation and fast publishing.',
          }, {
            t: lang === 'tr' ? 'Güven' : 'Trust',
            d: lang === 'tr' ? 'Kullanıcı odaklı güvenlik.' : 'Verification and user-first safety.',
          }, {
            t: lang === 'tr' ? 'Destek' : 'Support',
            d: lang === 'tr' ? 'Soruların için her zaman buradayız.' : 'We’re here to help whenever you need.',
          }].map((c) => (
            <div key={c.t} className="rounded-2xl border border-border bg-background p-4">
              <div className="font-semibold mb-1">{c.t}</div>
              <div className="text-muted-foreground text-sm">{c.d}</div>
            </div>
          ))}
        </div>

        <p className="text-muted-foreground">
          {lang === 'tr'
            ? 'Geliştirme sürecimiz devam ediyor. Geri bildirimlerinle ilanpazar’ı daha iyi hale getirebilirsin.'
            : 'We’re continuously improving. Your feedback helps make ilanpazar better.'}
        </p>
      </div>
    </StaticPageShell>
  )
}
