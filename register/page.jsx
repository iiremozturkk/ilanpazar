'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowRight } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useLanguage } from '@/components/language-provider'

export default function RegisterPage() {
  const { t, lang } = useLanguage()
  const { register } = useAuth()
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const setField = (key, val) => {
    setForm(p => ({ ...p, [key]: val }))
    setErrors(p => ({ ...p, [key]: '' }))
  }

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = t.auth.errors.nameRequired
    if (!form.email.trim()) errs.email = t.auth.errors.emailRequired
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = t.auth.errors.emailInvalid
    if (!form.password) errs.password = t.auth.errors.passwordRequired
    else if (form.password.length < 6) errs.password = t.auth.errors.passwordMin
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await register(form.name, form.email, form.password, form.phone)
      toast.success(t.auth.registerToastWelcome)
      router.push('/dashboard')
    } catch (err) {
      if (err.message === 'EMAIL_EXISTS') {
        toast.error(t.auth.errors.emailExists)
        setErrors(p => ({ ...p, email: t.auth.errors.emailExists }))
      } else {
        toast.error(t.auth.errors.registerFailed)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
      <div className="min-h-screen flex">
      {/* Left brand panel */}
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
            {t.auth.registerHeroTitle}
          </h2>
          <p className="text-muted-foreground dark:text-white/60 text-lg leading-relaxed max-w-sm mx-auto mb-10">
            {t.auth.registerHeroSubtitle}
          </p>

          <div className="grid grid-cols-3 gap-4">
            {[
              { value: '50K+', label: t.hero.stats.listings },
              { value: '120K+', label: t.hero.stats.users },
              { value: '200K+', label: t.hero.stats.sold },
            ].map(item => (
              <div key={item.label} className="bg-black/5 dark:bg-white/5 rounded-xl p-4 border border-black/10 dark:border-white/10">
                <div className="text-2xl font-extrabold text-foreground dark:text-white">{item.value}</div>
                <div className="text-xs text-muted-foreground dark:text-white/50 mt-1">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-sm">
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-md shadow-primary/25">
                <img src="/logo.png" alt="ilanpazar" className="w-full h-full object-cover" />
              </div>
              <span className="text-2xl font-extrabold text-foreground">ilan<span className="text-primary">pazar</span></span>
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-foreground mb-2">{t.auth.registerTitle}</h1>
            <p className="text-muted-foreground">{t.auth.registerSubtitle}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t.auth.name}</label>
              <div className="relative">
                <User size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setField('name', e.target.value)}
                  placeholder={lang === "tr" ? "Ali Veli" : "John Doe"}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border bg-background text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors ${errors.name ? 'border-destructive' : 'border-input'}`}
                />
              </div>
              {errors.name && <p className="text-destructive text-xs mt-1">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t.auth.email}</label>
              <div className="relative">
                <Mail size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setField('email', e.target.value)}
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
                  value={form.password}
                  onChange={e => setField('password', e.target.value)}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-10 py-3 rounded-xl border bg-background text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors ${errors.password ? 'border-destructive' : 'border-input'}`}
                />
                <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {errors.password && <p className="text-destructive text-xs mt-1">{errors.password}</p>}
            </div>

            {/* Phone (optional) */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t.auth.phone}</label>
              <div className="relative">
                <Phone size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setField('phone', e.target.value)}
                  placeholder="05XX XXX XX XX"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90 disabled:opacity-60 transition-opacity"
            >
              {loading ? t.common.loading : (
                <>
                  {t.auth.registerBtn}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            {t.auth.hasAccount}{' '}
            <Link href="/login" className="text-primary font-semibold hover:underline">
              {t.auth.signIn}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
