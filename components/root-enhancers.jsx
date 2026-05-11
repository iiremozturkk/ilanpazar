"use client"

import { usePathname } from 'next/navigation'
import AIChatAssistant from '@/components/ai-chat-assistant'

// Root-level UI helpers (AI chat, etc.)
// Requirement: Do NOT show AI Chat on /admin routes.
export default function RootEnhancers({ children }) {
  const pathname = usePathname() || ''
  const hideAIChat = pathname.startsWith('/admin')

  return (
    <>
      {children}
      {!hideAIChat && <AIChatAssistant />}
    </>
  )
}
