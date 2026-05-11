'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { translations } from '@/lib/i18n'

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('tr')

  useEffect(() => {
    const saved = localStorage.getItem('ilanpazar_lang')
    if (saved === 'en' || saved === 'tr') {
      setLang(saved)
    }
  }, [])

  const toggleLang = () => {
    const newLang = lang === 'tr' ? 'en' : 'tr'
    setLang(newLang)
    localStorage.setItem('ilanpazar_lang', newLang)
  }

  const setLanguage = (l) => {
    setLang(l)
    localStorage.setItem('ilanpazar_lang', l)
  }

  const t = translations[lang]

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
