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
      <div className="min-h-screen bg-slate-50/60 font-sans">
        <Navbar />
        <main className="max-w-6xl mx-auto px-4 py-20 flex items-center justify-center">
          <p className="text-xs font-bold tracking-wider text-slate-400 uppercase animate-pulse">Loading property details...</p>
        </main>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-slate-50/60 font-sans">
        <Navbar />
        <main className="max-w-6xl mx-auto px-4 py-20 text-center space-y-4">
          <h2 className="text-xl font-black text-slate-900">Property Listing Not Found</h2>
          <Link href="/" className="inline-block bg-slate-900 text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-slate-800 transition">
            ← Back to Explore Listings
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
  const encodedMsg = encodeURIComponent(`Hello! I am inquiring about your listing "${property.title}" on Nestar Homes.`)
  const whatsappUrl = cleanedWhatsApp ? `https://wa.me/${cleanedWhatsApp}?text=${encodedMsg}` : null
  const phoneUrl = property.owner?.phone_number ? `tel:${property.owner.phone_number}` : null

  return (
    <div className="min-h-screen bg-slate-50/60 font-sans text-slate-900 relative pb-16">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        
        {/* Navigation Breadcrumb */}
        <div>
          <Link 
            href="/" 
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition"
          >
            ← Back to Listings
          </Link>
        </div>

        {/* Top Header Card: Title, Status, Rent Price */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                {property.title}
              </h1>

              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                  isAvailable
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : isPending
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : isRented
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${
                  isAvailable ? 'bg-emerald-500' : isPending ? 'bg-amber-500' : isRented ? 'bg-blue-500' : 'bg-slate-400'
                }`} />
                {property.status}
              </span>
            </div>

            <p className="text-xs sm:text-sm font-semibold text-slate-500 flex items-center gap-1">
              📍 {property.village_name ? `${property.village_name}, ` : ''}{property.town_name}, Greater Wakiso
            </p>
          </div>

          <div className="bg-slate-900 text-white p-4 sm:px-6 sm:py-4 rounded-2xl shadow-sm text-left md:text-right w-full md:w-auto">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              Monthly Rent
            </span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-400">
              {Number(property.rent_amount).toLocaleString()} <span className="text-xs font-extrabold text-slate-300">{property.currency}</span>
            </span>
          </div>
        </div>

        {/* Grid Layout: Main Left Content vs Right Sticky Action Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left Column: Gallery & Description (Spans 2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl p-3 border border-slate-200/80 shadow-xs overflow-hidden">
              <PropertyGallery images={property.images} title={property.title} town={property.town_name} />
            </div>

            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-3">
              <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                Property Overview & Details
              </h2>
              <p className="text-slate-700 leading-relaxed text-xs sm:text-sm whitespace-pre-line font-normal">
                {property.description || 'No detailed description provided for this listing.'}
              </p>
            </div>
          </div>

          {/* Right Column: Unified Sticky Action Card */}
          <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-8">
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-6">
              
              {/* Landlord Header */}
              <div className="space-y-2 pb-4 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    Property Listed By
                  </span>
                  {property.owner?.is_verified && (
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      ✓ Verified Partner
                    </span>
                  )}
                </div>

                {property.owner?.full_name ? (
                  <h3 className="text-base font-black text-slate-900 tracking-tight">
                    {property.owner.full_name}
                  </h3>
                ) : (
                  <h3 className="text-sm font-bold text-slate-700">
                    Nestar Verified Landlord
                  </h3>
                )}
              </div>

              {/* Direct Contact Actions */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Direct Contact Options
                </span>

                <div className="space-y-2.5">
                  {whatsappUrl ? (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 transition shadow-sm cursor-pointer text-center"
                    >
                      💬 Chat on WhatsApp
                    </a>
                  ) : (
                    <div className="w-full bg-slate-100 text-slate-400 text-center font-bold text-xs py-3 rounded-2xl border border-slate-200/60">
                      WhatsApp Unavailable
                    </div>
                  )}

                  {phoneUrl ? (
                    <a
                      href={phoneUrl}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black text-xs py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 transition shadow-sm cursor-pointer text-center"
                    >
                      📞 Call Direct Phone
                    </a>
                  ) : (
                    <div className="w-full bg-slate-100 text-slate-400 text-center font-bold text-xs py-3 rounded-2xl border border-slate-200/60">
                      Phone Unavailable
                    </div>
                  )}
                </div>
              </div>

              {/* Viewing Request Box */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Schedule In-Person Inspection
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                    {isAvailable
                      ? 'Select an inspection date to schedule a verified viewing with the landlord.'
                      : 'This property is currently not accepting new viewing appointments.'}
                  </p>
                </div>

                {isAvailable ? (
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-3 px-4 rounded-2xl border border-slate-200 transition cursor-pointer text-center"
                  >
                    Request Viewing Access →
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full bg-slate-100 text-slate-400 font-bold text-xs py-3 rounded-2xl border border-slate-200/60 cursor-not-allowed"
                  >
                    {isRented ? 'Property Rented' : isPending ? 'Offer Pending' : 'Archived'}
                  </button>
                )}
              </div>

            </div>
          </div>

        </div>

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
