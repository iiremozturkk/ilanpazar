'use client'

import StaticPageShell from '@/components/static-page-shell'
import { useLanguage } from '@/components/language-provider'

export default function ContactPage() {
  const { lang } = useLanguage()

  return (
    <StaticPageShell
      title={lang === 'tr' ? 'İletişim' : 'Contact'}
      subtitle={
        lang === 'tr'
          ? 'Bize ulaşmak için aşağıdaki kanalları kullanabilirsiniz.'
          : 'Use the channels below to reach us.'
      }
    >
      <div className="space-y-6 text-sm sm:text-base">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-border bg-background p-5">
            <div className="font-semibold mb-1">{lang === 'tr' ? 'E-posta' : 'Email'}</div>
            <div className="text-muted-foreground">support@ilanpazar.com</div>
          </div>
          <div className="rounded-2xl border border-border bg-background p-5">
            <div className="font-semibold mb-1">{lang === 'tr' ? 'Çalışma Saatleri' : 'Working Hours'}</div>
            <div className="text-muted-foreground">
              {lang === 'tr' ? 'Pzt–Cum 09:00–18:00 (TR)' : 'Mon–Fri 09:00–18:00 (TR)'}
            </div>
          </div>
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
