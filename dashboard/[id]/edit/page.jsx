'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import ListingForm from '@/components/listing-form'
import { useLanguage } from '@/components/language-provider'

export default function EditListingPage() {
  const { id } = useParams()
  const { t } = useLanguage()
  const [listing, setListing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!id) return
    fetch(`/api/listings/${id}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(data => setListing(data.listing))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 size={32} className="text-primary animate-spin" />
      </div>
    )
  }

  if (error || !listing) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-foreground mb-2">{t.common.error}</h2>
          <p className="text-muted-foreground">{t.common.retry}</p>
        </div>
      </div>
    )
  }

  return <ListingForm initialData={listing} listingId={id} />
}
