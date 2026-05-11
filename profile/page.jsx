'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/use-auth'
import { useLanguage } from '@/components/language-provider'
import { toast } from 'sonner'

export default function ProfilePage() {
  const router = useRouter()
  const { user } = useAuth()
  const { lang } = useLanguage()

  const [loading, setLoading] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const fileInputRef = useRef(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '', avatarUrl: '', currentPassword: '', newPassword: '' })

  useEffect(() => {
    if (!user) return
    ;(async () => {
      try {
        const res = await fetch('/api/profile')
        const data = await res.json().catch(() => ({}))
        if (res.ok && data?.user) {
          setForm((f) => ({
            ...f,
            name: data.user.name || '',
            email: data.user.email || '',
            phone: data.user.phone || '',
            avatarUrl: data.user.avatar_url || '',
          }))
        }
      } catch {}
    })()
  }, [user])

  useEffect(() => {
    if (user === null) {
      router.push('/login')
    }
  }, [user, router])


  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error(lang === 'tr' ? 'Sadece JPG, PNG ve WEBP desteklenir.' : 'Only JPG, PNG and WEBP are supported.')
      e.target.value = ''
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(lang === 'tr' ? 'Dosya boyutu en fazla 5MB olabilir.' : 'File size can be at most 5MB.')
      e.target.value = ''
      return
    }

    setUploadingPhoto(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.url) {
        toast.error(data?.error || (lang === 'tr' ? 'Fotoğraf yüklenemedi.' : 'Photo upload failed.'))
        return
      }
      setForm((f) => ({ ...f, avatarUrl: data.url }))
      toast.success(lang === 'tr' ? 'Fotoğraf yüklendi.' : 'Photo uploaded.')
    } catch {
      toast.error(lang === 'tr' ? 'Fotoğraf yüklenemedi.' : 'Photo upload failed.')
    } finally {
      setUploadingPhoto(false)
      e.target.value = ''
    }
  }

  const save = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          avatarUrl: form.avatarUrl || null,
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const msg =
          data?.error === 'INVALID_PASSWORD'
            ? (lang === 'tr' ? 'Mevcut şifre yanlış.' : 'Current password is incorrect.')
            : data?.error === 'PASSWORD_MIN'
              ? (lang === 'tr' ? 'Yeni şifre en az 6 karakter olmalı.' : 'New password must be at least 6 characters.')
              : (lang === 'tr' ? 'Kaydetme başarısız.' : 'Save failed.')
        toast.error(msg)
        return
      }

      const updatedUser = {
        ...(user || {}),
        name: form.name,
        email: form.email,
        phone: form.phone || null,
        avatar_url: form.avatarUrl || null,
      }
      window.dispatchEvent(new CustomEvent('auth:user-updated', { detail: updatedUser }))
      toast.success(lang === 'tr' ? 'Profil güncellendi.' : 'Profile updated.')
      setForm((f) => ({ ...f, currentPassword: '', newPassword: '' }))
    } catch {
      toast.error(lang === 'tr' ? 'Bir hata oluştu.' : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-72px)] px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="rounded-2xl border border-border bg-card shadow-lg overflow-hidden">
          <div className="px-6 py-5 border-b border-border">
            <h1 className="text-lg font-semibold text-foreground">{lang === 'tr' ? 'Profili Düzenle' : 'Edit Profile'}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {lang === 'tr' ? 'Profil fotoğrafı, ad, telefon ve şifrenizi güncelleyebilirsiniz.' : 'Update your profile photo, name, phone, and password.'}
            </p>
          </div>

          <div className="p-6 grid gap-4">
            <div>
              <label className="text-sm font-medium text-foreground">{lang === 'tr' ? 'Profil Fotoğrafı' : 'Profile photo'}</label>
              <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="relative w-24 h-24 rounded-full overflow-hidden border border-border bg-muted">
                  {form.avatarUrl ? (
                    <Image
                      src={form.avatarUrl}
                      alt={lang === 'tr' ? 'Profil fotoğrafı' : 'Profile photo'}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-semibold text-muted-foreground">
                      {form.name?.trim()?.[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploadingPhoto}>
                      {uploadingPhoto
                        ? (lang === 'tr' ? 'Yükleniyor...' : 'Uploading...')
                        : (lang === 'tr' ? 'Fotoğraf Seç' : 'Choose Photo')}
                    </Button>
                    {form.avatarUrl && (
                      <Button type="button" variant="ghost" onClick={() => setForm((f) => ({ ...f, avatarUrl: '' }))}>
                        {lang === 'tr' ? 'Fotoğrafı Kaldır' : 'Remove Photo'}
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {lang === 'tr' ? 'JPG, PNG veya WEBP. En fazla 5MB.' : 'JPG, PNG or WEBP. Up to 5MB.'}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">{lang === 'tr' ? 'Ad Soyad' : 'Full name'}</label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Email</label>
              <Input value={form.email} readOnly className="opacity-80" />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">{lang === 'tr' ? 'Telefon' : 'Phone'}</label>
              <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder={lang === 'tr' ? 'Telefon (opsiyonel)' : 'Phone (optional)'} />
            </div>

            <div className="pt-2 border-t border-border" />

            <div className="grid gap-2">
              <div className="text-sm font-semibold text-foreground">{lang === 'tr' ? 'Şifre Değiştir' : 'Change Password'}</div>
              <div className="text-xs text-muted-foreground">
                {lang === 'tr' ? 'Şifre değiştirmek istemiyorsanız boş bırakın.' : 'Leave blank if you don\'t want to change it.'}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">{lang === 'tr' ? 'Mevcut Şifre' : 'Current password'}</label>
              <Input type="password" value={form.currentPassword} onChange={(e) => setForm((f) => ({ ...f, currentPassword: e.target.value }))} />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">{lang === 'tr' ? 'Yeni Şifre' : 'New password'}</label>
              <Input type="password" value={form.newPassword} onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))} />
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={save} disabled={loading} className="gap-2">
                {loading ? (lang === 'tr' ? 'Kaydediliyor...' : 'Saving...') : (lang === 'tr' ? 'Kaydet' : 'Save')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
