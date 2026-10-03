'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Property {
  id: string
  title: string
  location: string
  rent: number
  status: 'Active' | 'Rented' | 'Pending' | 'Archived'
}

export default function ManageListingsPage() {
  // Demo state - replace or sync with your database/Supabase client
  const [properties, setProperties] = useState<Property[]>([
    { id: '1', title: 'Quiet Escape', location: 'Kayunga', rent: 800000, status: 'Active' },
    { id: '2', title: 'Naska Apartments', location: 'Kawempe', rent: 1200000, status: 'Active' },
    { id: '3', title: 'Modern House 2 Bedrooms', location: 'Kasubi Market', rent: 1500000, status: 'Rented' },
  ])

  const handleStatusChange = (id: string, newStatus: Property['status']) => {
    setProperties((prev) =>
      prev.map((prop) => (prop.id === id ? { ...prop, status: newStatus } : prop))
    )
    // TODO: Trigger API update (e.g., await supabase.from('properties').update({ status: newStatus }).eq('id', id))
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/" className="text-sm font-medium text-emerald-600 hover:underline">
              ← Back to home
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 mt-2">Manage Listings</h1>
            <p className="text-sm text-gray-600">Edit property details and toggle availability statuses.</p>
          </div>
          <Link
            href="/submit"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            + Post New Property
          </Link>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-100 text-xs font-semibold text-gray-700 uppercase">
              <tr>
                <th className="px-6 py-4">Property Title</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Rent (UGX)</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {properties.map((prop) => (
                <tr key={prop.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-semibold text-gray-900">{prop.title}</td>
                  <td className="px-6 py-4">{prop.location}</td>
                  <td className="px-6 py-4">{prop.rent.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <select
                      value={prop.status}
                      onChange={(e) => handleStatusChange(prop.id, e.target.value as Property['status'])}
                      className={`rounded-md px-2.5 py-1 text-xs font-semibold border ${
                        prop.status === 'Active'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : prop.status === 'Rented'
                          ? 'border-blue-200 bg-blue-50 text-blue-700'
                          : prop.status === 'Pending'
                          ? 'border-amber-200 bg-amber-50 text-amber-700'
                          : 'border-gray-200 bg-gray-100 text-gray-600'
                      }`}
                    >
                      <option value="Active">Active</option>
                      <option value="Rented">Rented</option>
                      <option value="Pending">Pending</option>
                      <option value="Archived">Archived</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/submit?edit=${prop.id}`}
                      className="font-medium text-emerald-600 hover:underline mr-4"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
