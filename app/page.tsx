'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

interface Property {
  id: string
  title: string
  location?: string
  town_name?: string
  village_name?: string
  address?: string
  price?: number
  rent_amount?: number
  currency?: string
  image_url?: string
  images?: string[] | string
}

export default function HomePage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [selectedLocation, setSelectedLocation] = useState<string>('All Locations')
  const [maxBudget, setMaxBudget] = useState<number>(2000000)
  const [loading, setLoading] = useState<boolean>(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadProperties() {
      setLoading(true)
      const { data, error } = await supabase.from('properties').select('*')
      
      if (error) {
        console.error('Supabase fetch error:', error.message)
      }

      if (!error && data && data.length > 0) {
        setProperties(data)
      } else {
        setProperties([
          {
            id: 'ceb47f2b-1105-4624-9cb7-8d85e9474e79',
            title: 'Modern 2 Bedroom Apartment',
            town_name: 'Sonde',
            village_name: 'Luwero Zone',
            rent_amount: 800000,
            currency: 'UGX',
            images: ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80'],
          },
          {
            id: 'd8a12e34-5678-4901-abcd-ef1234567890',
            title: 'Spacious 3 Bedroom House',
            town_name: 'Kyaliwajala',
            village_name: 'Namugongo Road',
            rent_amount: 1200000,
            currency: 'UGX',
            images: ['https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=600&q=80'],
          },
          {
            id: 'f9b23c45-6789-4012-bcde-f23456789012',
            title: '1 Bedroom Cozy Studio',
            town_name: 'Kira',
            village_name: 'Kito Zone',
            rent_amount: 550000,
            currency: 'UGX',
            images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80'],
          },
        ])
      }
      setLoading(false)
    }

    loadProperties()
  }, [supabase])

  const locations = ['All Locations', 'Sonde', 'Kyaliwajala', 'Kira']

  const filteredProperties = properties.filter((item) => {
    const itemLocation = item.town_name || item.location || ''
    const itemPrice = item.rent_amount ?? item.price ?? 0

    const matchesLocation =
      selectedLocation === 'All Locations' || itemLocation.toLowerCase() === selectedLocation.toLowerCase()
    const matchesPrice = itemPrice <= maxBudget
    return matchesLocation && matchesPrice
  })

  const getPrimaryImage = (images?: string[] | string, defaultUrl?: string) => {
    if (Array.isArray(images) && images.length > 0) return images[0]
    if (typeof images === 'string') {
      try {
        const parsed = JSON.parse(images)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed[0]
      } catch {
        return images
      }
    }
    return defaultUrl || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80'
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
              Verified Rental Listings
            </h1>
            <p className="text-sm md:text-base text-gray-500 mt-1">
              Find apartments and houses across Kampala & Greater Wakiso
            </p>
          </div>
          <Link
            href="/submit"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition shadow-sm self-start md:self-auto"
          >
            + List Property
          </Link>
        </div>

        {/* Filter Controls */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                Filter by Location
              </label>
              <div className="flex flex-wrap gap-2">
                {locations.map((loc) => (
                  <button
                    key={loc}
                    onClick={() => setSelectedLocation(loc)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                      selectedLocation === loc
                        ? 'bg-gray-900 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>

            <div className="w-full md:w-72 space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider">Max Budget</span>
                <span className="text-emerald-600 font-mono">
                  {maxBudget.toLocaleString()} UGX
                </span>
              </div>
              <input
                type="range"
                min={300000}
                max={3000000}
                step={50000}
                value={maxBudget}
                onChange={(e) => setMaxBudget(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Grid Display */}
        {loading ? (
          <div className="p-12 text-center text-gray-500 text-sm">Loading rental listings from Supabase...</div>
        ) : filteredProperties.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-gray-100 text-center text-gray-500 text-sm">
            No properties matching filter.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((property, idx) => {
              const displayLocation = property.town_name || property.location || 'Uganda'
              const displaySub = property.village_name || property.address || ''
              const displayPrice = property.rent_amount ?? property.price ?? 0
              const displayCurrency = property.currency || 'UGX'
              const imgUrl = getPrimaryImage(property.images, property.image_url)

              return (
                <div
                  key={property.id}
                  className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm flex flex-col hover:shadow-md transition"
                >
                  <div className="relative h-52 w-full bg-gray-100">
                    <Image
                      src={imgUrl}
                      alt={property.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      priority={idx === 0}
                      className="object-cover"
                    />
                    <span className="absolute top-3 left-3 bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md shadow-sm">
                      {displayLocation}
                    </span>
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <h3 className="text-base font-bold text-gray-900 line-clamp-1">
                        {property.title}
                      </h3>
                      <p className="text-xs text-gray-400 mt-1">{displaySub}</p>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                      <div>
                        <span className="block text-[10px] text-gray-400 font-semibold uppercase">
                          Monthly Rent
                        </span>
                        <span className="text-sm font-bold text-emerald-600 font-mono">
                          {displayPrice.toLocaleString()} {displayCurrency}
                        </span>
                      </div>
                      <Link
                        href={`/properties/${property.id}`}
                        className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold rounded-xl transition shadow-sm"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}
