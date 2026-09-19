'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import { createClient } from '@/lib/supabase/client'

interface ViewingLead {
  id: string
  property_id?: string
  property_title: string
  phone_number: string
  network: string
  amount: number
  currency: string
  status: string
  created_at: string
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<ViewingLead[]>([])
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    async function verifyAndFetch() {
      setLoading(true)

      // 1. Role Authorization Guard (Admin & Tech Auditor only)
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

      if (!profile || !['admin', 'tech_auditor'].includes(profile.role)) {
        setAuthorized(false)
        setLoading(false)
        return
      }

      setAuthorized(true)

      // 2. Fetch viewing transactions cleanly matching the database schema
      const { data, error } = await supabase
        .from('viewings')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && data) {
        setLeads(data as ViewingLead[])
      } else {
        console.error('Error fetching viewing leads:', error)
      }
      setLoading(false)
    }

    verifyAndFetch()
  }, [supabase])

  const handleDispatchContact = (phoneNumber: string) => {
    if (!phoneNumber) return
    const cleanedNumber = phoneNumber.replace(/\s+/g, '')
    window.open(`https://wa.me/${cleanedNumber}`, '_blank')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-16 text-center text-xs font-semibold text-gray-400">
          Authenticating viewing payment records...
        </div>
      </div>
    )
  }

  if (!authorized) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <h2 className="text-lg font-bold text-gray-900">Access Restricted</h2>
          <p className="text-xs text-gray-500 mt-1">
            This verification ledger is limited to Administrators and Tech Auditors.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              Payment Verification & Lead Dispatch
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Live USSD Mobile Money callback logs for physical property viewings
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          {leads.length === 0 ? (
            <div className="p-12 text-center text-xs font-semibold text-gray-400">
              No viewing transactions recorded yet.
            </div>
          ) : (
            <>
              {/* Mobile Card View (< md) */}
              <div className="block md:hidden divide-y divide-gray-100">
                {leads.map((lead) => (
                  <div key={lead.id} className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-gray-400">
                        {lead.created_at ? new Date(lead.created_at).toLocaleString() : 'N/A'}
                      </span>
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${
                        lead.status === 'CONFIRMED' || lead.status === 'SUCCESS' || lead.status === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          : 'bg-amber-50 text-amber-700 border-amber-100'
                      }`}>
                        {lead.status || 'PENDING'}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">
                        {lead.property_title || 'Property Inspection'}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono text-xs font-semibold text-gray-800">
                          {lead.phone_number || 'N/A'}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-gray-100 text-gray-600 border border-gray-200">
                          {lead.network || 'USSD'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="font-bold text-emerald-600 text-sm">
                        {lead.amount ? Number(lead.amount).toLocaleString() : '10,000'} {lead.currency || 'UGX'}
                      </span>
                      <button
                        onClick={() => handleDispatchContact(lead.phone_number)}
                        className="px-3 py-1.5 rounded-xl text-[11px] font-bold text-white bg-gray-900 hover:bg-emerald-600 transition cursor-pointer"
                      >
                        Dispatch Contact
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View (>= md) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      <th className="py-4 px-6">Timestamp</th>
                      <th className="py-4 px-6">Property Title</th>
                      <th className="py-4 px-6">Payment Phone</th>
                      <th className="py-4 px-6">Network</th>
                      <th className="py-4 px-6">Amount</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                    {leads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-gray-50/50 transition">
                        <td className="py-4 px-6 text-gray-400 font-mono text-[11px]">
                          {lead.created_at ? new Date(lead.created_at).toLocaleString() : 'N/A'}
                        </td>
                        <td className="py-4 px-6 font-bold text-gray-900">
                          {lead.property_title || 'Property Inspection'}
                        </td>
                        <td className="py-4 px-6 font-mono text-gray-900 font-semibold">
                          {lead.phone_number || 'N/A'}
                        </td>
                        <td className="py-4 px-6">
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700 border border-gray-200">
                            {lead.network || 'USSD'}
                          </span>
                        </td>
                        <td className="py-4 px-6 font-bold text-emerald-600">
                          {lead.amount ? Number(lead.amount).toLocaleString() : '10,000'} {lead.currency || 'UGX'}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${
                            lead.status === 'CONFIRMED' || lead.status === 'SUCCESS' || lead.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                              : 'bg-amber-50 text-amber-700 border-amber-100'
                          }`}>
                            {lead.status || 'PENDING'}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <button
                            onClick={() => handleDispatchContact(lead.phone_number)}
                            className="px-3 py-1.5 rounded-xl text-[11px] font-bold text-white bg-gray-900 hover:bg-emerald-600 transition cursor-pointer"
                          >
                            Dispatch Contact
                          </button>
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
