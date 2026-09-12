'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface ViewingLead {
  id: string
  created_at: string
  phone: string
  property_title: string
  network: string
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED'
}

export default function AdminViewingsPage() {
  const [leads, setLeads] = useState<ViewingLead[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    fetchLeads()
  }, [])

  const fetchLeads = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('viewing_requests')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setLeads(data)
    } else {
      // Fallback local state if table is empty/simulated
      setLeads([
        {
          id: '1',
          created_at: new Date().toISOString(),
          phone: '256705485667',
          property_title: 'Modern 2 Bedroom Apartment',
          network: 'AIRTEL',
          status: 'PENDING',
        },
      ])
    }
    setLoading(false)
  }

  const updateStatus = async (id: string, newStatus: ViewingLead['status']) => {
    setLeads((prev) =>
      prev.map((lead) => (lead.id === id ? { ...lead, status: newStatus } : lead))
    )
    await supabase.from('viewing_requests').update({ status: newStatus }).eq('id', id)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inspection Leads</h1>
            <p className="text-sm text-gray-500">Manage verified property viewing requests</p>
          </div>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
          >
            Sign Out
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-500">Loading leads...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4">Property</th>
                    <th className="px-6 py-4">Phone / Network</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {leads.map((lead) => {
                    const formattedPhone = lead.phone.replace(/\D/g, '')
                    const whatsappMsg = encodeURIComponent(
                      `Hello! Regarding your inspection request for ${lead.property_title} on Nestar Homes:`
                    )
                    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${whatsappMsg}`

                    return (
                      <tr key={lead.id} className="hover:bg-gray-50/50">
                        <td className="px-6 py-4 font-semibold text-gray-900">
                          {lead.property_title}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-mono text-gray-900">+{formattedPhone}</div>
                          <span className="text-xs text-gray-400 font-semibold">{lead.network}</span>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={lead.status}
                            onChange={(e) => updateStatus(lead.id, e.target.value as any)}
                            className="bg-gray-50 border border-gray-200 text-xs font-semibold rounded-lg px-2.5 py-1.5 text-gray-700 outline-none focus:ring-2 focus:ring-emerald-500"
                          >
                            <option value="PENDING">PENDING</option>
                            <option value="CONFIRMED">CONFIRMED</option>
                            <option value="COMPLETED">COMPLETED</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 space-x-2">
                          <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1.5 bg-emerald-50 text-emerald-700 font-semibold text-xs rounded-lg hover:bg-emerald-100 transition"
                          >
                            WhatsApp
                          </a>
                          <a
                            href={`tel:+${formattedPhone}`}
                            className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 font-semibold text-xs rounded-lg hover:bg-gray-200 transition"
                          >
                            Call
                          </a>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
