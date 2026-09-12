'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import PropertyGallery from '../../components/PropertyGallery'
import ViewingModal from '../../components/ViewingModal'

interface Property {
  id: string
  title: string
  town_name: string
  village_name: string
  description: string
  rent_amount: number
  currency: string
  status: string
  images: string[]
  created_at: string
}

type Props = {
  params: Promise<{ id: string }>
}

export default function PropertyDetailPage({ params }: Props) {
  const resolvedParams = use(params)
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    async function fetchProperty() {
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kccxmxxkwppeavcjvewd.supabase.co'
      const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_MwLDXjKZHS9E7kIA9QUYYg_kpEvN_GU'

      try {
        const res = await fetch(`${baseUrl}/rest/v1/properties?id=eq.${resolvedParams.id}&select=*`, {
          headers: {
            'apikey': apiKey,
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        })

        if (res.ok) {
          const data: Property[] = await res.json()
          if (data.length > 0) setProperty(data[0])
        }
      } catch (err) {
        console.error('Fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProperty()
  }, [resolvedParams.id])

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-12 flex items-center justify-center">
        <p className="text-sm font-semibold text-slate-400 animate-pulse">Loading listing details...</p>
      </main>
    )
  }

  if (!property) {
    return (
      <main className="min-h-screen bg-slate-50 p-12 text-center">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Property Not Found</h2>
        <Link href="/" className="text-sm text-emerald-600 font-bold hover:underline">
          ← Back to home
        </Link>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="max-w-4xl mx-auto mb-6">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition">
          ← Back to listings
        </Link>
      </div>

      <article className="max-w-4xl mx-auto bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
        <PropertyGallery images={property.images || []} title={property.title} town={property.town_name} />

        <div className="p-6 md:p-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-1">{property.title}</h1>
              <p className="text-sm text-slate-500">
                {property.village_name ? `${property.village_name}, ` : ''}{property.town_name}, Greater Wakiso
              </p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-left md:text-right">
              <span className="text-xs text-slate-400 block font-medium">Monthly Rent</span>
              <span className="text-2xl font-black text-emerald-700">
                {Number(property.rent_amount).toLocaleString()} {property.currency}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-4">
              <h2 className="text-lg font-bold text-slate-900">Property Overview</h2>
              <p className="text-slate-600 leading-relaxed text-sm md:text-base whitespace-pre-line">
                {property.description || 'No detailed description provided for this listing.'}
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200/80 h-fit space-y-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Schedule Viewing</h3>
              <p className="text-xs text-slate-500 leading-normal">
                Reserve an in-person viewing slot. Direct verification guarantees inspection priority.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full bg-slate-900 text-white py-3 rounded-xl font-semibold text-sm hover:bg-slate-800 transition shadow-sm"
              >
                Request Viewing Access
              </button>
            </div>
          </div>
        </div>
      </article>

      <ViewingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        propertyTitle={property.title}
        propertyPrice={property.rent_amount}
        currency={property.currency}
      />
    </main>
  )
}
