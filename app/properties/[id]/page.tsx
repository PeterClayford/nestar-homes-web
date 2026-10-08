'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import PropertyGallery from '@/components/PropertyGallery'
import ViewingModal from '@/components/ViewingModal'
import AbigailWidget from '@/components/AbigailWidget'

interface PropertyOwner {
  full_name?: string
  phone_number?: string
  whatsapp_number?: string
  is_verified?: boolean
}

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
  owner?: PropertyOwner
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
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

      try {
        const selectQuery = 'id,title,town_name,village_name,description,rent_amount,currency,status,images,created_at,owner:profiles!landlord_id(full_name,phone_number,whatsapp_number,is_verified)'
        const res = await fetch(
          `${baseUrl}/rest/v1/properties?id=eq.${resolvedParams.id}&select=${encodeURIComponent(selectQuery)}`,
          {
            headers: {
              'apikey': apiKey,
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            }
          }
        )

        if (res.ok) {
          const data: any[] = await res.json()
          if (data.length > 0) {
            let fetchedImages: any = data[0].images

            if (typeof fetchedImages === 'string') {
              try {
                fetchedImages = JSON.parse(fetchedImages)
              } catch {
                fetchedImages = [fetchedImages]
              }
            }

            if (!Array.isArray(fetchedImages) || fetchedImages.length === 0) {
              fetchedImages = [
                'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80'
              ]
            }

            const ownerObj = Array.isArray(data[0].owner) ? data[0].owner[0] : data[0].owner

            setProperty({
              ...data[0],
              images: fetchedImages,
              owner: ownerObj
            })
          }
        }
      } catch (err) {
        console.error('Error fetching property details:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProperty()
  }, [resolvedParams.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans">
        <Navbar />
        <main className="p-12 flex items-center justify-center">
          <p className="text-sm font-semibold text-slate-400 animate-pulse">Loading listing details & gallery...</p>
        </main>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans">
        <Navbar />
        <main className="p-12 text-center">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Property Not Found</h2>
          <Link href="/" className="text-sm text-emerald-600 font-bold hover:underline">
            ← Back to home
          </Link>
        </main>
      </div>
    )
  }

  const isAvailable = property.status === 'AVAILABLE' || property.status === 'Active'
  const isPending = property.status === 'PENDING' || property.status === 'Pending'
  const isRented = property.status === 'RENTED' || property.status === 'Rented'

  const rawWhatsApp = property.owner?.whatsapp_number || property.owner?.phone_number || ''
  const cleanedWhatsApp = rawWhatsApp.replace(/[\s\-\+\(\)]/g, '')
  const encodedMsg = encodeURIComponent(`Hello! I'm inquiring about your listing "${property.title}" on Nestar Homes.`)
  const whatsappUrl = cleanedWhatsApp ? `https://wa.me/${cleanedWhatsApp}?text=${encodedMsg}` : null
  const phoneUrl = property.owner?.phone_number ? `tel:${property.owner.phone_number}` : null

  return (
    <div className="min-h-screen bg-slate-50 font-sans relative">
      <Navbar />

      <main className="p-6 md:p-12">
        <div className="max-w-4xl mx-auto mb-6">
          <Link href="/" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition">
            ← Back to listings
          </Link>
        </div>

        <article className="max-w-4xl mx-auto bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
          <PropertyGallery images={property.images} title={property.title} town={property.town_name} />

          <div className="p-6 md:p-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6 mb-6">
              <div>
                <div className="flex items-center gap-3 flex-wrap mb-1">
                  <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{property.title}</h1>

                  {/* Property Status Badge */}
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                      isAvailable
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : isPending
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : isRented
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-gray-100 text-gray-600 border border-gray-200'
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        isAvailable ? 'bg-emerald-500' : isPending ? 'bg-amber-500' : isRented ? 'bg-blue-500' : 'bg-gray-400'
                      }`}
                    />
                    {property.status}
                  </span>
                </div>
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

              {/* Sidebar Action Column */}
              <div className="bg-slate-50 rounded-xl p-6 border border-slate-200/80 h-fit space-y-6">
                
                {/* Section 1: Schedule Viewing */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Schedule Viewing</h3>
                  <p className="text-xs text-slate-500 leading-normal">
                    {isAvailable
                      ? 'Reserve an in-person viewing slot. Direct verification guarantees inspection priority.'
                      : 'This property is currently not accepting new viewing requests.'}
                  </p>

                  {isAvailable ? (
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="w-full bg-slate-900 text-white py-3 rounded-xl font-semibold text-sm hover:bg-slate-800 transition shadow-sm cursor-pointer"
                    >
                      Request Viewing Access
                    </button>
                  ) : (
                    <button
                      disabled
                      className="w-full bg-slate-200 text-slate-500 py-3 rounded-xl font-semibold text-sm cursor-not-allowed"
                    >
                      {isRented ? 'Currently Rented' : isPending ? 'Viewing Under Offer' : 'Listing Archived'}
                    </button>
                  )}
                </div>

                {/* Section 2: Direct Contact Landlord Actions */}
                <div className="pt-4 border-t border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Listed By
                    </span>
                    {property.owner?.is_verified && (
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-black px-2 py-0.5 rounded-md uppercase">
                        ✓ Verified
                      </span>
                    )}
                  </div>

                  {property.owner?.full_name && (
                    <p className="text-xs font-extrabold text-slate-800">
                      {property.owner.full_name}
                    </p>
                  )}

                  <div className="space-y-2 pt-1">
                    {whatsappUrl ? (
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3 rounded-xl flex items-center justify-center gap-2 transition shadow-xs cursor-pointer text-center"
                      >
                        💬 Chat on WhatsApp
                      </a>
                    ) : (
                      <div className="w-full bg-slate-200 text-slate-400 text-center font-bold text-xs py-2.5 rounded-xl">
                        No WhatsApp Listed
                      </div>
                    )}

                    {phoneUrl ? (
                      <a
                        href={phoneUrl}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-3 rounded-xl flex items-center justify-center gap-2 transition shadow-xs cursor-pointer text-center"
                      >
                        📞 Call Direct Phone
                      </a>
                    ) : (
                      <div className="w-full bg-slate-200 text-slate-400 text-center font-bold text-xs py-2.5 rounded-xl">
                        No Phone Listed
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>
        </article>

        <ViewingModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          propertyId={property.id}
          propertyTitle={property.title}
          propertyPrice={property.rent_amount}
          currency={property.currency}
        />
      </main>

      <AbigailWidget propertyId={resolvedParams.id} />
    </div>
  )
}
