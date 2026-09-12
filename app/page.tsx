'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { createClient } from '@/lib/supabase/client'

interface UserProfile {
  id: string
  role: 'client' | 'landlord' | 'property_manager' | 'broker' | 'admin' | 'tech_auditor'
  status: string
}

export default function HomePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchProfile() {
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
    }

    fetchProfile()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchProfile()
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const sampleProperties = [
    {
      id: 'ceb47f2b-1105-4624-9cb7-8d85e9474e79',
      title: 'Modern 2 Bedroom Apartment',
      location: 'Sonde',
      zone: 'Luwero Zone',
      price: '800,000 UGX',
      image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
    },
    {
      id: '7a9d6c1b-4bba-4030-a2c5-0b6aedaf0ef0',
      title: 'Spacious 3 Bedroom House',
      location: 'Kyaliwajala',
      zone: 'Namugongo Road',
      price: '1,200,000 UGX',
      image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
    },
    {
      id: 'f0728c39-7e39-4442-a2c3-66a80df31447',
      title: '1 Bedroom Cozy Studio',
      location: 'Kira',
      zone: 'Kito Zone',
      price: '550,000 UGX',
      image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Dynamic Role-Aware Navigation Bar */}
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

          {/* "+ List Property" Button: Strictly Hidden from Clients */}
          {!loading && profile && ['landlord', 'property_manager', 'broker', 'admin'].includes(profile.role) && (
            <Link
              href="/submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-sm transition self-stretch md:self-auto text-center"
            >
              + List Property
            </Link>
          )}

          {/* Client Upgrade Callout Banner */}
          {!loading && profile?.role === 'client' && (
            <Link
              href="/account/upgrade"
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs px-5 py-3 rounded-xl border border-emerald-200 transition self-stretch md:self-auto text-center"
            >
              Are you a Landlord or Broker? Apply to List
            </Link>
          )}
        </div>

        {/* Filter Controls */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">
              Filter By Location
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold shadow-sm">
                All Locations
              </button>
              <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition">
                Sonde
              </button>
              <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition">
                Kyaliwajala
              </button>
              <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition">
                Kira
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              <span>Max Budget</span>
              <span className="text-emerald-600 font-extrabold text-xs">2,000,000 UGX</span>
            </div>
            <input
              type="range"
              min="300000"
              max="3000000"
              defaultValue="2000000"
              className="w-full md:w-64 accent-emerald-600 cursor-pointer"
            />
          </div>
        </div>

        {/* Property Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {sampleProperties.map((prop) => (
            <div
              key={prop.id}
              className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition group"
            >
              <div>
                <div className="relative h-52 w-full overflow-hidden bg-gray-100">
                  <img
                    src={prop.image}
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
                  <p className="text-xs text-gray-400 font-medium">{prop.zone}</p>
                </div>
              </div>

              <div className="p-5 pt-0 flex items-center justify-between border-t border-gray-50 mt-4">
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
                    Monthly Rent
                  </div>
                  <div className="text-xs font-black text-emerald-600">{prop.price}</div>
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

      </main>
    </div>
  )
}
