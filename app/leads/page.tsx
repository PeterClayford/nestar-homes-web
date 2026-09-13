'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import { createClient } from '@/lib/supabase/client'

interface ViewingLead {
  id: string
  created_at: string
  scheduled_date: string
  status: string
  payment_status: string
  payment_phone: string
  transaction_ref: string
  amount_paid: number
  currency: string
  client_name?: string
  client_phone?: string
  properties?: {
    title: string
    town_name: string
    village_name: string
    landlord_phone?: string
  }
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<ViewingLead[]>([])
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    async function verifyAndFetch() {
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

      if (!profile || !['admin', 'tech_auditor'].includes(profile.role)) {
        setAuthorized(false)
        setLoading(false)
        return
      }

      setAuthorized(true)

      const { data, error } = await supabase
        .from('viewings')
        .select(`
          id,
          created_at,
          scheduled_date,
          status,
          payment_status,
          payment_phone,
          transaction_ref,
          amount_paid,
          currency,
          client_name,
          client_phone,
          properties (
            title,
            town_name,
            village_name,
            landlord_phone
          )
        `)
        .order('created_at', { ascending: false })

      if (!error && data) {
        setLeads(data as ViewingLead[])
      } else {
        console.error('Error fetching leads:', error)
      }
      setLoading(false)
    }

    verifyAndFetch()
  }, [supabase])

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
              No verified viewing transactions recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    <th className="py-4 px-6">Timestamp</th>
                    <th className="py-4 px-6">Property / Location</th>
                    <th className="py-4 px-6">Payment Phone</th>
                    <th className="py-4 px-6">Tx Reference</th>
                    <th className="py-4 px-6">Amount</th>
                    <th className="py-4 px-6">Payment Status</th>
                    <th className="py-4 px-6">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                  {leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50/50 transition">
                      <td className="py-4 px-6 text-gray-400 font-mono text-[11px]">
                        {new Date(lead.created_at).toLocaleString()}
                      </td>
                      <td className="py-4 px-6 font-bold text-gray-900">
                        {lead.properties?.title || 'Property Inspection'}
                        <div className="text-[10px] font-normal text-gray-400">
                          {lead.properties?.town_name}, {lead.properties?.village_name}
                        </div>
                      </td>
                      <td className="py-4 px-6 font-mono text-gray-900 font-semibold">
                        {lead.payment_phone || lead.client_phone || 'N/A'}
                      </td>
                      <td className="py-4 px-6 font-mono text-[11px] text-gray-500">
                        {lead.transaction_ref || 'PENDING_CALLBACK'}
                      </td>
                      <td className="py-4 px-6 font-bold text-emerald-600">
                        {lead.amount_paid ? lead.amount_paid.toLocaleString() : '10,000'} {lead.currency || 'UGX'}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${
                          lead.payment_status === 'SUCCESS' || lead.payment_status === 'VERIFIED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            : 'bg-amber-50 text-amber-700 border-amber-100'
                        }`}>
                          {lead.payment_status || 'UNPAID'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <button
                          disabled={lead.payment_status !== 'SUCCESS' && lead.payment_status !== 'VERIFIED'}
                          className="px-3 py-1.5 rounded-xl text-[11px] font-bold text-white bg-gray-900 hover:bg-emerald-600 disabled:bg-gray-200 disabled:text-gray-400 transition cursor-pointer"
                        >
                          Dispatch Contact
                        </button>
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
