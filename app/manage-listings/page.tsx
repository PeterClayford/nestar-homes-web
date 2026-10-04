'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { createClient } from '@/lib/supabase/client'

interface ManagedProperty {
  id: string
  title: string
  town_name: string
  village_name?: string
  rent_amount: number
  currency: string
  status: string
  images: string[]
  landlord_id: string
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

      if (!user) {
        setLoading(false)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const userIsAdmin = profile?.role === 'admin' || profile?.role === 'tech_auditor'
      setIsAdmin(userIsAdmin)

      let query = supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false })

      if (!userIsAdmin) {
        query = query.eq('landlord_id', user.id)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching properties:', error)
      } else if (data) {
        setProperties(data as ManagedProperty[])
      }

      setLoading(false)
    }

    fetchProperties()
  }, [supabase])

  const handleStatusChange = async (id: string, newStatus: string) => {
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
      alert('Could not update status in database.')
    }

    setUpdatingId(null)
  }

  const totalListings = properties.length
  const activeListings = properties.filter((p) => p.status === 'AVAILABLE' || p.status === 'Active').length
  const totalRevenue = properties.reduce((sum, p) => sum + Number(p.rent_amount || 0), 0)

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-20 md:pb-12">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 space-y-6 md:space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl md:rounded-3xl border border-gray-100 shadow-sm">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
              <Link href="/" className="hover:text-emerald-600 transition">
                Home
              </Link>
              <span>/</span>
              <span className="text-gray-700">Property Portal</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight mt-1 flex items-center gap-2 flex-wrap">
              Manage Listings
              {isAdmin && (
                <span className="bg-rose-100 text-rose-700 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full">
                  Admin View
                </span>
              )}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {isAdmin
                ? 'Overview and management for all properties across Nestar Homes.'
                : 'Control availability, update unit details, and monitor status for your posted properties.'}
            </p>
          </div>

          <Link
            href="/submit"
            className="w-full sm:w-auto inline-flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-sm transition gap-2"
          >
            <span>+</span> Post New Property
          </Link>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm space-y-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              {isAdmin ? 'Total System Properties' : 'Your Listings'}
            </span>
            <div className="text-xl sm:text-2xl font-black text-gray-900">{totalListings} Units</div>
          </div>
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm space-y-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Active Listings
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-600">{activeListings} Live</div>
          </div>
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm space-y-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Monthly Rent Potential
            </span>
            <div className="text-xl sm:text-2xl font-black text-gray-900">
              {totalRevenue.toLocaleString()} <span className="text-xs font-bold text-gray-400">UGX</span>
            </div>
          </div>
        </div>

        {/* Property Inventory Container */}
        <div className="bg-white rounded-2xl md:rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-xs sm:text-sm font-extrabold text-gray-900 uppercase tracking-wider">
              Property Inventory
            </h2>
            <span className="text-xs font-semibold text-gray-400">
              Showing {properties.length} listings
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs font-semibold text-gray-400">
              Loading your property inventory...
            </div>
          ) : properties.length === 0 ? (
            <div className="p-8 sm:p-12 text-center space-y-3">
              <p className="text-sm font-bold text-gray-800">You haven't posted any properties yet.</p>
              <Link
                href="/submit"
                className="inline-block text-xs font-bold text-emerald-600 hover:underline"
              >
                + Post your first rental listing
              </Link>
            </div>
          ) : (
            <>
              {/* MOBILE VIEW: Touch-Friendly Stacked Cards */}
              <div className="block md:hidden divide-y divide-gray-100">
                {properties.map((prop) => (
                  <div key={prop.id} className="p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <img
                        src={prop.images && prop.images.length > 0 ? prop.images[0] : '/placeholder.png'}
                        alt={prop.title}
                        className="h-16 w-20 rounded-xl object-cover border border-gray-100 bg-gray-100 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-extrabold text-gray-900 text-sm truncate">{prop.title}</h3>
                        <p className="text-xs text-gray-500 font-medium truncate mt-0.5">
                          📍 {prop.town_name}{prop.village_name ? `, ${prop.village_name}` : ''}
                        </p>
                        <div className="text-sm font-black text-emerald-700 mt-1">
                          {Number(prop.rent_amount).toLocaleString()} <span className="text-[10px] font-bold text-gray-400">{prop.currency}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                      <select
                        value={prop.status}
                        disabled={updatingId === prop.id}
                        onChange={(e) => handleStatusChange(prop.id, e.target.value)}
                        className={`rounded-xl px-3 py-1.5 text-xs font-bold cursor-pointer border focus:outline-none transition ${
                          prop.status === 'AVAILABLE' || prop.status === 'Active'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : prop.status === 'RENTED' || prop.status === 'Rented'
                            ? 'border-blue-200 bg-blue-50 text-blue-700'
                            : prop.status === 'PENDING' || prop.status === 'Pending'
                            ? 'border-amber-200 bg-amber-50 text-amber-700'
                            : 'border-gray-200 bg-gray-100 text-gray-600'
                        }`}
                      >
                        <option value="AVAILABLE">● AVAILABLE</option>
                        <option value="RENTED">● RENTED</option>
                        <option value="PENDING">● PENDING</option>
                        <option value="ARCHIVED">● ARCHIVED</option>
                      </select>

                      <div className="flex items-center gap-3">
                        <Link
                          href={`/properties/${prop.id}`}
                          className="text-xs font-bold text-gray-500 hover:text-gray-900 transition px-2 py-1"
                        >
                          View
                        </Link>
                        <Link
                          href={`/submit?edit=${prop.id}`}
                          className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition"
                        >
                          Edit
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* DESKTOP VIEW: Full Table */}
              <div className="hidden md:block overflow-x-auto">
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
                              src={prop.images && prop.images.length > 0 ? prop.images[0] : '/placeholder.png'}
                              alt={prop.title}
                              className="h-12 w-16 rounded-lg object-cover border border-gray-100 bg-gray-100"
                            />
                            <div>
                              <div className="font-extrabold text-gray-900 text-sm">{prop.title}</div>
                              <div className="text-[10px] text-gray-400 font-medium">ID: {prop.id.substring(0, 8)}...</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-700">
                          {prop.town_name}{prop.village_name ? `, ${prop.village_name}` : ''}
                        </td>
                        <td className="px-6 py-4 font-black text-gray-900">
                          {Number(prop.rent_amount).toLocaleString()} {prop.currency}
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={prop.status}
                            disabled={updatingId === prop.id}
                            onChange={(e) => handleStatusChange(prop.id, e.target.value)}
                            className={`rounded-xl px-3 py-1.5 text-xs font-bold cursor-pointer border focus:outline-none transition ${
                              prop.status === 'AVAILABLE' || prop.status === 'Active'
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                : prop.status === 'RENTED' || prop.status === 'Rented'
                                ? 'border-blue-200 bg-blue-50 text-blue-700'
                                : prop.status === 'PENDING' || prop.status === 'Pending'
                                ? 'border-amber-200 bg-amber-50 text-amber-700'
                                : 'border-gray-200 bg-gray-100 text-gray-600'
                            }`}
                          >
                            <option value="AVAILABLE">● AVAILABLE</option>
                            <option value="RENTED">● RENTED</option>
                            <option value="PENDING">● PENDING</option>
                            <option value="ARCHIVED">● ARCHIVED</option>
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
            </>
          )}
        </div>

      </main>
    </div>
  )
}
