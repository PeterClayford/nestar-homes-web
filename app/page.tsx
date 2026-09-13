'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { createClient } from '@/lib/supabase/client'
import { getPublishedProperties, Property } from '@/lib/db/properties'

interface UserProfile {
  id: string
  role: 'client' | 'landlord' | 'property_manager' | 'broker' | 'admin' | 'tech_auditor'
  status: string
}

export default function HomePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [propertiesLoading, setPropertiesLoading] = useState(true)
  
  // Dynamic search and budget slider states
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [maxBudget, setMaxBudget] = useState<number>(5000000)
  const [dynamicUpperLimit, setDynamicUpperLimit] = useState<number>(5000000)

  const supabase = createClient()

  useEffect(() => {
    async function fetchData() {
      // 1. Fetch User Session Profile
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('id, role, status')
          .eq('id', user.id)
          .single()
        if (data) setProfile(data as UserProfile)
      }
      setLoading(false)

      // 2. Fetch Mapped Properties via Central Helper
      setPropertiesLoading(true)
      const data = await getPublishedProperties(supabase)
      setProperties(data)

      // Dynamically calculate the highest price in the database
      if (data.length > 0) {
        const highestPrice = Math.max(...data.map((p) => p.price), 5000000)
        setDynamicUpperLimit(highestPrice)
        setMaxBudget(highestPrice)
      }

      setPropertiesLoading(false)
    }

    fetchData()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchData()
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  // Dynamic filter logic for broad text search across town, zone, and title
  const filteredProperties = properties.filter((prop) => {
    const q = searchQuery.toLowerCase().trim()
    const matchesSearch =
      !q ||
      prop.location.toLowerCase().includes(q) ||
      prop.zone.toLowerCase().includes(q) ||
      prop.title.toLowerCase().includes(q)
    
    const matchesBudget = prop.price <= maxBudget
    return matchesSearch && matchesBudget
  })

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Hero Section */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              Verified Rental Listings
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Find apartments and houses across Kampala & Greater Wakiso
            </p>
          </div>

          {!loading && profile && ['landlord', 'property_manager', 'broker', 'admin'].includes(profile.role) && (
            <Link
              href="/submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-sm transition self-stretch md:self-auto text-center"
            >
              + List Property
            </Link>
          )}

          {!loading && profile?.role === 'client' && (
            <Link
              href="/account/upgrade"
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs px-5 py-3 rounded-xl border border-emerald-200 transition self-stretch md:self-auto text-center"
            >
              Are you a Landlord or Broker? Apply to List
            </Link>
          )}
        </div>

        {/* Global Search Input & Dynamic Budget Slider */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="w-full md:w-2/3">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              Global Search
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Search town, zone, or title (e.g. Kyaliwajjala, Sonde, Apartment)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-xs font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-gray-50/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-3 text-xs font-bold text-gray-400 hover:text-gray-600"
                >
                  ✕ Clear
                </button>
              )}
            </div>
          </div>

          <div className="w-full md:w-1/3">
            <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              <span>Max Budget</span>
              <span className="text-emerald-600 font-extrabold text-xs">
                {maxBudget.toLocaleString()} UGX
              </span>
            </div>
            <input
              type="range"
              min="100000"
              max={dynamicUpperLimit}
              step="50000"
              value={maxBudget}
              onChange={(e) => setMaxBudget(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
          </div>
        </div>

        {/* Dynamic Property Grid */}
        {propertiesLoading ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm text-xs font-semibold text-gray-400">
            Fetching properties from database...
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm space-y-2">
            <h3 className="text-sm font-bold text-gray-900">No properties found</h3>
            <p className="text-xs text-gray-400">
              No listings match your search query and budget range.
            </p>
            <button
              onClick={() => {
                setSearchQuery('')
                setMaxBudget(dynamicUpperLimit)
              }}
              className="mt-2 text-xs font-bold text-emerald-600 hover:underline cursor-pointer"
            >
              Reset Search & Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredProperties.map((prop) => (
              <div
                key={prop.id}
                className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition group"
              >
                <div>
                  <div className="relative h-52 w-full overflow-hidden bg-gray-100">
                    <img
                      src={prop.coverImage}
                      alt={prop.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <span className="absolute top-4 left-4 bg-emerald-600 text-white text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-lg shadow-sm">
                      {prop.location}
                    </span>
                  </div>

                  <div className="p-5 space-y-1">
                    <h3 className="font-extrabold text-gray-900 text-base tracking-tight">
                      {prop.title}
                    </h3>
                    <p className="text-xs text-gray-400 font-medium">
                      {prop.zone}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-0 flex items-center justify-between border-t border-gray-50 mt-4">
                  <div>
                    <div className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
                      Monthly Rent
                    </div>
                    <div className="text-xs font-black text-emerald-600">
                      {prop.price.toLocaleString()} {prop.currency}
                    </div>
                  </div>

                  <Link
                    href={`/properties/${prop.id}`}
                    className="bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  )
}
