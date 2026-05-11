'use client'

import StaticPageShell from '@/components/static-page-shell'
import { useLanguage } from '@/components/language-provider'

export default function HelpPage() {
  const { lang } = useLanguage()

  return (
    <StaticPageShell
      title={lang === 'tr' ? 'Yardım' : 'Help'}
      subtitle={
        lang === 'tr'
          ? 'Sık sorulan sorular ve hızlı çözümler.'
          : 'Frequently asked questions and quick fixes.'
      }
    >
      <div className="space-y-5 text-sm sm:text-base">
        <details className="rounded-xl border border-border bg-background p-4" open>
          <summary className="font-semibold cursor-pointer">
            {lang === 'tr' ? 'Nasıl ilan verebilirim?' : 'How do I post a listing?'}
          </summary>
          <div className="mt-3 text-muted-foreground">
            {lang === 'tr'
              ? 'Giriş yaptıktan sonra "İlan Ver" butonuna tıklayın. Başlık, açıklama, fiyat ve görselleri ekleyip yayınlayın.'
              : 'After logging in, click “Post Ad”. Add title, description, price and images, then publish.'}
          </div>
        </details>

        <details className="rounded-xl border border-border bg-background p-4">
          <summary className="font-semibold cursor-pointer">
            {lang === 'tr' ? 'İlanım görünmüyor, ne yapmalıyım?' : 'My listing doesn’t show up. What now?'}
          </summary>
          <div className="mt-3 text-muted-foreground">
            {lang === 'tr'
              ? 'İlanlar yalnızca "Aktif" durumdayken genel listelerde görünür. Panelinizden ilan durumunu kontrol edin.'
              : 'Listings show in public feeds only when they are “Active”. Check the status from your dashboard.'}
          </div>
        </details>

        <details className="rounded-xl border border-border bg-background p-4">
          <summary className="font-semibold cursor-pointer">
            {lang === 'tr' ? 'Güvenli alışveriş ipuçları' : 'Safe trading tips'}
          </summary>
          <ul className="mt-3 list-disc pl-5 text-muted-foreground space-y-1">
            <li>{lang === 'tr' ? 'Tanımadığınız kişilere ön ödeme yapmayın.' : 'Avoid advance payments to unknown parties.'}</li>
            <li>{lang === 'tr' ? 'Buluşmaları kalabalık ve güvenli yerlerde yapın.' : 'Meet in crowded, safe places.'}</li>
            <li>{lang === 'tr' ? 'İlan detaylarını yazılı olarak netleştirin.' : 'Clarify details in writing.'}</li>
          </ul>
        </details>

        <p className="text-muted-foreground">
          {lang === 'tr'
            ? 'Daha hızlı yardım için sol alttaki AI Chat Assistant’ı kullanabilirsiniz.'
            : 'For faster help, use the AI Chat Assistant in the bottom-left.'}
        </p>
      </div>
    </StaticPageShell>
  )
}
