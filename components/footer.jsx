'use client'

import Link from 'next/link'
import { useLanguage } from './language-provider'

export default function Footer() {
  const { t, lang } = useLanguage()

  return (
    <footer className="py-16 border-t bg-card text-muted-foreground border-border dark:bg-[var(--brand-surface)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4 group w-fit">
              <div
                className="w-9 h-9 rounded-xl overflow-hidden shrink-0 transition-transform duration-200 group-hover:scale-105"
                style={{ boxShadow: '0 4px 14px rgba(249,115,22,0.3)' }}
              >
                <img src="/logo.png" alt="ilanpazar logo" className="w-full h-full object-cover" />
              </div>
              <span className="text-lg font-extrabold text-foreground tracking-tight">
                ilan<span style={{ color: 'var(--brand-orange)' }}>pazar</span>
              </span>
            </Link>

            <p className="text-sm leading-relaxed max-w-xs text-muted-foreground">
              {t.footer.tagline}
            </p>

            <div className="flex items-center gap-6 mt-6">
              <div>
                <div className="text-lg font-bold text-foreground">2.4M+</div>
                <div className="text-xs text-muted-foreground">{lang === 'tr' ? 'İlan' : 'Listings'}</div>
              </div>
              <div className="w-px h-8 bg-border" />
              <div>
                <div className="text-lg font-bold text-foreground">850K+</div>
                <div className="text-xs text-muted-foreground">{lang === 'tr' ? 'Kullanıcı' : 'Users'}</div>
              </div>
              <div className="w-px h-8 bg-border" />
              <div>
                <div className="text-lg font-bold text-foreground">98%</div>
                <div className="text-xs text-muted-foreground">{lang === 'tr' ? 'Memnuniyet' : 'Satisfaction'}</div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-foreground font-bold mb-4 text-xs uppercase tracking-widest opacity-80">Platform</h4>
            <ul className="space-y-3">
              {[
                { label: t.footer.about, href: '/about' },
                { label: t.footer.contact, href: '/contact' },
                { label: t.footer.help, href: '/help' },
                { label: lang === 'tr' ? 'İlanlar' : 'Listings', href: '/listings' },
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="text-sm transition-colors text-muted-foreground hover:text-foreground">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-foreground font-bold mb-4 text-xs uppercase tracking-widest opacity-80">Legal</h4>
            <ul className="space-y-3">
              {[{ label: t.footer.terms, href: '/terms' }, { label: t.footer.privacy, href: '/privacy' }].map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="text-sm transition-colors text-muted-foreground hover:text-foreground">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border">
          <p className="text-xs text-muted-foreground">{t.footer.copyright}</p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>{lang === 'tr' ? "Alimert Tosun" : 'Alimert Tosun'}</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
