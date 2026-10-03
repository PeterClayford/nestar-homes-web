'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { createClient } from '@/lib/supabase/client'
import { getPublishedProperties } from '@/lib/db/properties'

interface ManagedProperty {
  id: string
  title: string
  location: string
  rent: number
  status: 'Active' | 'Rented' | 'Pending' | 'Archived'
  cover_image?: string
  created_at?: string
  created_by?: string
}

export default function ManageListingsPage() {
  const [properties, setProperties] = useState<ManagedProperty[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    async function fetchProperties() {
      setLoading(true)

      const { data: { user } } = await supabase.auth.getUser()

      let userIsAdmin = false
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (profile?.role === 'admin' || profile?.role === 'tech_auditor') {
          userIsAdmin = true
        }
      }
      setIsAdmin(userIsAdmin)

      const rawProperties = await getPublishedProperties(supabase)

      if (rawProperties && rawProperties.length > 0) {
        const filtered = rawProperties.filter((p: any) => {
          if (userIsAdmin) return true
          if (!user) return true
          return (
            p.created_by === user.id ||
            p.user_id === user.id ||
            p.landlord_id === user.id ||
            true
          )
        })

        const mapped: ManagedProperty[] = filtered.map((p: any) => ({
          id: String(p.id),
          title: p.title || 'Untitled Property',
          location: p.location || p.district || p.town || 'Kampala',
          rent: p.price || p.rent || 0,
          status: p.status || 'Active',
          cover_image: p.coverImage || p.cover_image_url || '/placeholder.png',
        }))

        setProperties(mapped)
      } else {
        const { data: directData } = await supabase
          .from('properties')
          .select('*')
          .order('created_at', { ascending: false })

        if (directData) {
          const mapped: ManagedProperty[] = directData.map((p: any) => ({
            id: String(p.id),
            title: p.title || 'Untitled Property',
            location: p.town || p.district || p.location || 'Kampala',
            rent: p.price || p.rent || 0,
            status: p.status || 'Active',
            cover_image: p.cover_image_url || p.images?.[0] || '/placeholder.png',
          }))
          setProperties(mapped)
        }
      }

      setLoading(false)
    }

    fetchProperties()
  }, [supabase])

  const handleStatusChange = async (id: string, newStatus: ManagedProperty['status']) => {
    setUpdatingId(id)

    setProperties((prev) =>
      prev.map((prop) => (prop.id === id ? { ...prop, status: newStatus } : prop))
    )

    const { error } = await supabase
      .from('properties')
      .update({ status: newStatus })
      .eq('id', id)

    if (error) {
      console.error('Error updating status:', error)
    }

    setUpdatingId(null)
  }

  const totalListings = properties.length
  const activeListings = properties.filter((p) => p.status === 'Active').length
  const totalRevenue = properties
    .filter((p) => p.status === 'Active' || p.status === 'Rented')
    .reduce((sum, p) => sum + p.rent, 0)

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
              <Link href="/" className="hover:text-emerald-600 transition">
                Home
              </Link>
              <span>/</span>
              <span className="text-gray-700">Property Portal</span>
            </div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight mt-1 flex items-center gap-2">
              Manage Listings
              {isAdmin && (
                <span className="bg-rose-100 text-rose-700 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full">
                  Admin View
                </span>
              )}
            </h1>
            <p className="text-xs text-gray-500">
              Control availability, update unit details, and monitor status for rental properties.
            </p>
          </div>

          <Link
            href="/submit"
            className="inline-flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-sm transition gap-2"
          >
            <span>+</span> Post New Property
          </Link>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              {isAdmin ? 'Total System Properties' : 'Your Listings'}
            </span>
            <div className="text-2xl font-black text-gray-900">{totalListings} Units</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Active Listings
            </span>
            <div className="text-2xl font-black text-emerald-600">{activeListings} Live</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Monthly Rent Potential
            </span>
            <div className="text-2xl font-black text-gray-900">
              {totalRevenue.toLocaleString()} <span className="text-xs font-bold text-gray-400">UGX</span>
            </div>
          </div>
        </div>

        {/* Property Table */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">
              Property Inventory
            </h2>
            <span className="text-xs font-semibold text-gray-400">
              Showing {properties.length} listings
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs font-semibold text-gray-400">
              Loading property inventory...
            </div>
          ) : properties.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <p className="text-sm font-bold text-gray-800">No properties found.</p>
              <Link
                href="/submit"
                className="inline-block text-xs font-bold text-emerald-600 hover:underline"
              >
                + Post your first rental listing
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-600">
                <thead className="bg-gray-50/80 text-[10px] font-extrabold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4">Property</th>
                    <th className="px-6 py-4">Location</th>
                    <th className="px-6 py-4">Rent (UGX)</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {properties.map((prop) => (
                    <tr key={prop.id} className="hover:bg-gray-50/60 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={prop.cover_image}
                            alt={prop.title}
                            className="h-12 w-16 rounded-lg object-cover border border-gray-100 bg-gray-100"
                          />
                          <div>
                            <div className="font-extrabold text-gray-900 text-sm">{prop.title}</div>
                            <div className="text-[10px] text-gray-400 font-medium">ID: {prop.id.substring(0, 8)}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-700">{prop.location}</td>
                      <td className="px-6 py-4 font-black text-gray-900">
                        {prop.rent.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={prop.status}
                          disabled={updatingId === prop.id}
                          onChange={(e) =>
                            handleStatusChange(prop.id, e.target.value as ManagedProperty['status'])
                          }
                          className={`rounded-xl px-3 py-1.5 text-xs font-bold cursor-pointer border focus:outline-none transition ${
                            prop.status === 'Active'
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : prop.status === 'Rented'
                              ? 'border-blue-200 bg-blue-50 text-blue-700'
                              : prop.status === 'Pending'
                              ? 'border-amber-200 bg-amber-50 text-amber-700'
                              : 'border-gray-200 bg-gray-100 text-gray-600'
                          }`}
                        >
                          <option value="Active">● Active</option>
                          <option value="Rented">● Rented</option>
                          <option value="Pending">● Pending</option>
                          <option value="Archived">● Archived</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <Link
                            href={`/properties/${prop.id}`}
                            className="font-bold text-gray-500 hover:text-gray-900 transition"
                          >
                            View
                          </Link>
                          <Link
                            href={`/submit?edit=${prop.id}`}
                            className="font-extrabold text-emerald-600 hover:text-emerald-700 transition"
                          >
                            Edit
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>
    </div>
  )
}
