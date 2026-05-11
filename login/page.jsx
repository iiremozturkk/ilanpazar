'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useLanguage } from '@/components/language-provider'

export default function LoginPage() {
  const { t, lang } = useLanguage()
  const { login } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const validate = () => {
    const errs = {}
    if (!email.trim()) errs.email = t.auth.errors.emailRequired
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = t.auth.errors.emailInvalid
    if (!password) errs.password = t.auth.errors.passwordRequired
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await login(email, password)
      toast.success(t.auth.toastWelcome)
      router.push('/dashboard')
    } catch (err) {
      if (err.message === 'INVALID_CREDENTIALS') {
        toast.error(t.auth.errors.loginFailed)
      } else {
        toast.error(t.auth.errors.loginFailed)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
      <div className="min-h-screen flex">
      {/* Left: Brand panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-muted/40 dark:bg-[var(--brand-hero-bg)] relative overflow-hidden flex-col items-center justify-center p-12">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-primary/15 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-primary/10 blur-3xl" />
        </div>
        <div className="relative text-center">
          <Link href="/" className="inline-flex items-center gap-3 mb-12">
            <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-lg shadow-primary/30">
              <img src="/logo.png" alt="ilanpazar" className="w-full h-full object-cover" />
            </div>
            <span className="text-3xl font-extrabold text-foreground dark:text-white">ilan<span className="text-primary">pazar</span></span>
          </Link>
          <h2 className="text-4xl font-extrabold text-foreground dark:text-white mb-4 text-balance">
            {t.auth.heroTitle}
          </h2>
          <p className="text-muted-foreground dark:text-white/60 text-lg leading-relaxed max-w-sm mx-auto">
            {t.auth.heroSubtitle}
          </p>

          {/* Floating cards */}
          <div className="mt-12 space-y-3">
            {t.auth.sampleCards.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 bg-black/5 dark:bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-black/10 dark:border-white/10 text-left animate-float"
                style={{ animationDelay: `${i * 0.7}s` }}
              >
                <span className="text-2xl">{item.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-foreground dark:text-white font-medium text-sm truncate">{item.title}</p>
                  <p className="text-muted-foreground dark:text-white/50 text-xs">{item.time}</p>
                </div>
                <span className="text-primary font-bold text-sm shrink-0">{item.price}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-md shadow-primary/25">
                <img src="/logo.png" alt="ilanpazar" className="w-full h-full object-cover" />
              </div>
              <span className="text-2xl font-extrabold text-foreground">ilan<span className="text-primary">pazar</span></span>
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-foreground mb-2">{t.auth.loginTitle}</h1>
            <p className="text-muted-foreground">{t.auth.loginSubtitle}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t.auth.email}</label>
              <div className="relative">
                <Mail size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '' })) }}
                  placeholder={lang === "tr" ? "ornek@email.com" : "example@email.com"}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border bg-background text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors ${errors.email ? 'border-destructive' : 'border-input'}`}
                />
              </div>
              {errors.email && <p className="text-destructive text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t.auth.password}</label>
              <div className="relative">
                <Lock size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors(p => ({ ...p, password: '' })) }}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-10 py-3 rounded-xl border bg-background text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors ${errors.password ? 'border-destructive' : 'border-input'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {errors.password && <p className="text-destructive text-xs mt-1">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90 disabled:opacity-60 transition-opacity"
            >
              {loading ? t.common.loading : (
                <>
                  {t.auth.loginBtn}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            {t.auth.noAccount}{' '}
            <Link href="/register" className="text-primary font-semibold hover:underline">
              {t.auth.signUp}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
