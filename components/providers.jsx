'use client'

import { ThemeProvider } from 'next-themes'
import { AuthProvider } from '@/hooks/use-auth'
import { CartProvider } from '@/components/cart-provider'
import { FavoritesProvider } from '@/components/favorites-provider'

export default function Providers({ children }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange={false}
    >
      <AuthProvider>
        <CartProvider>
          <FavoritesProvider>{children}</FavoritesProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
