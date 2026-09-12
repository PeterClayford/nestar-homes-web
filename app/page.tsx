'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

interface Property {
  id: string
  title: string
  location: string
  address: string
  price: number
  image_url: string
}

const MOCK_PROPERTIES: Property[] = [
  {
    id: 'ceb47f2b-1105-4624-9cb7-8d85e9474e79',
    title: 'Modern 2 Bedroom Apartment',
    location: 'Sonde',
    address: 'Luwero Zone, Sonde',
    price: 800000,
    image_url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'd8a12e34-5678-4901-abcd-ef1234567890',
    title: 'Spacious 3 Bedroom House',
    location: 'Kyaliwajala',
    address: 'Namugongo Road, Kyaliwajala',
    price: 1200000,
    image_url: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'f9b23c45-6789-4012-bcde-f23456789012',
    title: '1 Bedroom Cozy Studio',
    location: 'Kira',
    address: 'Kito Zone, Kira',
    price: 550000,
    image_url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80',
  },
]

export default function HomePage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [selectedLocation, setSelectedLocation] = useState<string>('All Locations')
  const [maxBudget, setMaxBudget] = useState<number>(1500000)
  const [loading, setLoading] = useState<boolean>(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadProperties() {
      setLoading(true)
      const { data, error } = await supabase.from('properties').select('*')
      if (!error && data && data.length > 0) {
        setProperties(data)
      } else {
        setProperties(MOCK_PROPERTIES)
      }
      setLoading(false)
    }
    loadProperties()
  }, [supabase])

  const locations = ['All Locations', 'Sonde', 'Kyaliwajala', 'Kira']

  const filteredProperties = properties.filter((item) => {
    const matchesLocation =
      selectedLocation === 'All Locations' || item.location === selectedLocation
    const matchesPrice = item.price <= maxBudget
    return matchesLocation && matchesPrice
  })

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* Hero Banner with Logo & Subtitle */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <Image
              src="/logo.svg"
              alt="Nestar Homes"
              width={120}
              height={32}
              className="h-8 w-auto object-contain"
            />
            <p className="text-xs md:text-sm text-gray-500 font-medium border-l border-gray-200 pl-4">
              Verified Rental Listings across Kampala & Greater Wakiso
            </p>
          </div>
          <Link
            href="/submit"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition shadow-sm self-start md:self-auto"
          >
            + List Property
          </Link>
        </div>

        {/* Location & Budget Filters */}
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
                max={2000000}
                step={50000}
                value={maxBudget}
                onChange={(e) => setMaxBudget(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Property Grid */}
        {loading ? (
          <div className="p-12 text-center text-gray-500 text-sm">Loading rental listings...</div>
        ) : filteredProperties.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-gray-100 text-center text-gray-500 text-sm">
            No properties found within this location or budget criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((property) => (
              <div
                key={property.id}
                className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm flex flex-col hover:shadow-md transition"
              >
                <div className="relative h-52 w-full bg-gray-100">
                  <Image
                    src={property.image_url}
                    alt={property.title}
                    fill
                    className="object-cover"
                  />
                  <span className="absolute top-3 left-3 bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md shadow-sm">
                    {property.location}
                  </span>
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-gray-900 line-clamp-1">
                      {property.title}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">{property.address}</p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                    <div>
                      <span className="block text-[10px] text-gray-400 font-semibold uppercase">
                        Monthly Rent
                      </span>
                      <span className="text-sm font-bold text-emerald-600 font-mono">
                        {property.price.toLocaleString()} UGX
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
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
