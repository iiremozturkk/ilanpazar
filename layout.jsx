import { Inter, Space_Mono } from 'next/font/google';
import { Toaster } from 'sonner';
import { LanguageProvider } from '@/components/language-provider';
import Providers from '@/components/providers';
import CookieConsent from '@/components/cookie-consent';
import AccessibilityWidget from '@/components/accessibility-widget';
import RootEnhancers from '@/components/root-enhancers';
import './globals.css';
const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
    display: 'swap',
});
const spaceMono = Space_Mono({
    subsets: ['latin'],
    weight: ['400', '700'],
    variable: '--font-space-mono',
    display: 'swap',
});
export const metadata = {
    title: 'ilanpazar',
    description: 'Türkiye\'nin en hızlı büyüyen ilan platformu. Ücretsiz ilan ver, saniyeler içinde sat.',
    keywords: 'ilanpazar, ilan, satılık, kiralık, alım satım, pazaryeri, türkiye',
    icons: {
        // Faviconlar: public/ ve app/ altında da mevcut (Next.js app router otomatik algılar).
        icon: [
            { url: '/favicon.ico' },
            { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
            { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
        ],
        shortcut: ['/favicon.ico'],
        apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    },
    openGraph: {
        title: 'ilanpazar — Al. Sat. Kazan.',
        description: 'Türkiye\'nin en hızlı büyüyen ilan platformu.',
        type: 'website',
    },
};
export default function RootLayout({ children }) {
    return (<html lang="tr" suppressHydrationWarning>
      <body className={`${inter.variable} ${spaceMono.variable} font-sans antialiased`}>
        <LanguageProvider>
          <Providers>
          <RootEnhancers>
            {children}
            <AccessibilityWidget />
            <CookieConsent />
          </RootEnhancers>
          <Toaster position="top-right" toastOptions={{
            style: {
                background: 'oklch(0.12 0.015 30)',
                color: 'oklch(0.95 0.005 60)',
                border: '1px solid oklch(0.25 0.01 30)',
            },
        }}/>
          </Providers>
        </LanguageProvider>
      </body>
    </html>);
}
