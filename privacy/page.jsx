'use client'

import StaticPageShell from '@/components/static-page-shell'
import { useLanguage } from '@/components/language-provider'

export default function PrivacyPage() {
  const { lang } = useLanguage()

  return (
    <StaticPageShell
      title={lang === 'tr' ? 'Gizlilik Politikası' : 'Privacy Policy'}
      subtitle={
        lang === 'tr'
          ? 'Kişisel verilerinizin nasıl işlendiğini burada bulabilirsiniz.'
          : 'Learn how we handle your personal data.'
      }
    >
      <div className="space-y-6 text-sm sm:text-base">
        <div>
          <div className="font-semibold mb-1">{lang === 'tr' ? 'Toplanan Veriler' : 'Data We Collect'}</div>
          <p className="text-muted-foreground">
            {lang === 'tr'
              ? 'Hesap bilgileri (ad, e-posta), ilan içerikleri ve kullanım verileri (ör. görüntülenme sayısı) gibi veriler işlenebilir.'
              : 'We may process account info (name, email), listing content, and usage data (e.g., view counts).'}
          </p>
        </div>

        <div>
          <div className="font-semibold mb-1">{lang === 'tr' ? 'Amaç' : 'Purpose'}</div>
          <p className="text-muted-foreground">
            {lang === 'tr'
              ? 'Hizmeti sunmak, güvenliği sağlamak, hata ayıklamak ve deneyimi geliştirmek.'
              : 'To provide the service, ensure safety, debug issues, and improve the experience.'}
          </p>
        </div>

        <div>
          <div className="font-semibold mb-1">{lang === 'tr' ? 'Çerezler' : 'Cookies'}</div>
          <p className="text-muted-foreground">
            {lang === 'tr'
              ? 'Oturum yönetimi ve tercihleri hatırlamak için çerezler kullanılabilir.'
              : 'Cookies may be used for session management and remembering preferences.'}
          </p>
        </div>

        <div>
          <div className="font-semibold mb-1">{lang === 'tr' ? 'İletişim' : 'Contact'}</div>
          <p className="text-muted-foreground">
            {lang === 'tr'
              ? 'Gizlilikle ilgili sorular için İletişim sayfasından bize yazabilirsiniz.'
              : 'For privacy questions, reach out via the Contact page.'}
          </p>
        </div>
      </div>
    </StaticPageShell>
  )
}
