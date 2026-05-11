'use client'

import StaticPageShell from '@/components/static-page-shell'
import { useLanguage } from '@/components/language-provider'

export default function TermsPage() {
  const { lang } = useLanguage()

  return (
    <StaticPageShell
      title={lang === 'tr' ? 'Kullanım Şartları' : 'Terms of Service'}
      subtitle={
        lang === 'tr'
          ? 'Platformu kullanarak aşağıdaki şartları kabul etmiş olursunuz.'
          : 'By using the platform, you agree to the terms below.'
      }
    >
      <div className="space-y-6 text-sm sm:text-base">
        <ol className="list-decimal pl-5 space-y-3">
          <li>
            <span className="font-semibold">{lang === 'tr' ? 'Kullanıcı Sorumluluğu' : 'User Responsibility'}: </span>
            <span className="text-muted-foreground">
              {lang === 'tr'
                ? 'Paylaştığınız ilan içeriklerinden ve doğruluğundan siz sorumlusunuz.'
                : 'You are responsible for the content you post and its accuracy.'}
            </span>
          </li>
          <li>
            <span className="font-semibold">{lang === 'tr' ? 'Yasaklı İçerikler' : 'Prohibited Content'}: </span>
            <span className="text-muted-foreground">
              {lang === 'tr'
                ? 'Yasalara aykırı, yanıltıcı, telif ihlali içeren veya dolandırıcılık amaçlı ilanlar yasaktır.'
                : 'Illegal, misleading, copyright-infringing, or fraudulent listings are prohibited.'}
            </span>
          </li>
          <li>
            <span className="font-semibold">{lang === 'tr' ? 'İlan Yayın Politikası' : 'Publishing Policy'}: </span>
            <span className="text-muted-foreground">
              {lang === 'tr'
                ? 'İlanlar incelenebilir, kurallara aykırı içerikler yayından kaldırılabilir.'
                : 'Listings may be reviewed and removed if they violate rules.'}
            </span>
          </li>
          <li>
            <span className="font-semibold">{lang === 'tr' ? 'Sorumluluk Reddi' : 'Disclaimer'}: </span>
            <span className="text-muted-foreground">
              {lang === 'tr'
                ? 'ilanpazar, alıcı ve satıcı arasındaki işlemlerden sorumlu değildir.'
                : 'ilanpazar is not responsible for transactions between buyers and sellers.'}
            </span>
          </li>
        </ol>

        <p className="text-muted-foreground">
          {lang === 'tr'
            ? 'Şartlar, gerekli görüldüğünde güncellenebilir.'
            : 'These terms may be updated when necessary.'}
        </p>
      </div>
    </StaticPageShell>
  )
}
