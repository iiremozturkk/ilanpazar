import { NextResponse } from 'next/server'

function lastUserMessage(messages = []) {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i]?.role === 'user') return String(messages[i]?.content || '')
  }
  return ''
}

function replyTR(text) {
  const t = text.toLowerCase()

  if (t.includes('ilan') && (t.includes('ver') || t.includes('ekle') || t.includes('paylaş') || t.includes('yayin') || t.includes('yayın'))) {
    return 'İlan vermek için: Giriş yap → Panelim → “İlan Ver” → Başlık/Açıklama/Fiyat/Kategori/Konum ve görselleri doldur → “İlanı Yayınla”.'
  }
  if (t.includes('görünm') || t.includes('görünmüyor') || t.includes('bulam')) {
    return 'İlanlar genel listelerde yalnızca “Aktif” durumdayken görünür. Panelinizden ilan durumunu kontrol edin. Ayrıca filtrelerde kategori/fiyat aralığını sıfırlayıp tekrar deneyin.'
  }
  if (t.includes('şifre') || t.includes('password') || t.includes('giriş') || t.includes('login')) {
    return 'Giriş sorunlarında e-posta/şifrenizi kontrol edin. Hâlâ olmazsa farklı bir tarayıcı deneyebilir veya çerezleri temizleyebilirsiniz.'
  }
  if (t.includes('güven') || t.includes('dolandır') || t.includes('scam')) {
    return 'Güvenlik: Ön ödeme yapmayın, buluşmaları kalabalık yerde yapın, ürün/evrak kontrolü yapın ve yazışmaları platformda saklayın.'
  }
  if (t.includes('iletişim') || t.includes('contact')) {
    return 'İletişim sayfasından destek kanallarını görebilirsiniz: /contact'
  }
  if (t.includes('şart') || t.includes('terms')) {
    return 'Kullanım şartları: /terms — Kısaca: yasaklı içerik yok, doğru bilgi paylaşın, alıcı-satıcı işlemlerinden kullanıcılar sorumludur.'
  }
  if (t.includes('gizlilik') || t.includes('privacy')) {
    return 'Gizlilik politikası: /privacy — Kısaca: hesap ve ilan bilgileri hizmeti sunmak için işlenir; tercihleri hatırlamak için çerezler kullanılabilir.'
  }

  return 'Yardımcı olayım 🙂 “Nasıl ilan veririm?”, “İlanım görünmüyor”, “Güvenli alışveriş” gibi sorular sorabilirsin.'
}

function replyEN(text) {
  const t = text.toLowerCase()

  if (t.includes('post') || t.includes('create') || (t.includes('listing') && (t.includes('add') || t.includes('publish')))) {
    return 'To post a listing: Log in → Dashboard → “Post Ad” → Fill Title/Description/Price/Category/Location + images → “Publish Listing”.'
  }
  if (t.includes("doesn't show") || t.includes('not showing') || t.includes('cannot find') || t.includes('missing')) {
    return 'Public feeds show listings only when status is “Active”. Check status in your dashboard. Also try resetting filters (category/price range).'
  }
  if (t.includes('password') || t.includes('login') || t.includes('sign in')) {
    return 'For login issues, double-check your email/password. If it still fails, try another browser or clear cookies.'
  }
  if (t.includes('safe') || t.includes('scam') || t.includes('fraud')) {
    return 'Safety: Avoid advance payments, meet in public places, verify the item/documents, and keep messages documented.'
  }
  if (t.includes('contact')) {
    return 'You can find support channels on the Contact page: /contact'
  }
  if (t.includes('terms')) {
    return 'Terms of Service: /terms — In short: no prohibited content, be accurate, buyers/sellers are responsible for transactions.'
  }
  if (t.includes('privacy')) {
    return 'Privacy Policy: /privacy — In short: account/listing data is processed to provide the service; cookies may remember preferences.'
  }

  return 'I can help 🙂 Try: “How do I post a listing?”, “My listing is not showing”, or “Safe trading tips”.'
}

export async function POST(request) {
  try {
    const body = await request.json()
    const msg = lastUserMessage(body.messages)
    const lang = body.lang === 'en' ? 'en' : 'tr'
    const reply = lang === 'en' ? replyEN(msg) : replyTR(msg)
    return NextResponse.json({ reply })
  } catch (e) {
    return NextResponse.json({ reply: 'Error' }, { status: 500 })
  }
}
