'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { createClient } from '@/lib/supabase/client'

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  phone_number: string | null
  whatsapp_number: string | null
  role: 'client' | 'landlord' | 'property_manager' | 'broker' | 'admin' | 'tech_auditor'
  status: 'active' | 'under_review' | 'frozen' | 'banned'
  is_verified: boolean
  verification_documents?: {
    nin_number?: string
    id_front?: string
    id_back?: string
    business_name?: string
  }
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadProfile() {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (data) setProfile(data as UserProfile)
      }
      setLoading(false)
    }

    loadProfile()
  }, [supabase])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans">
        <Navbar />
        <div className="max-w-xl mx-auto px-4 py-20 text-center text-xs font-semibold text-gray-400">
          Loading user profile...
        </div>
      </div>
    )
  }

  const isPartner = ['landlord', 'property_manager', 'broker', 'admin', 'tech_auditor'].includes(profile?.role || '')
  const frontDoc = profile?.verification_documents?.id_front
  const backDoc = profile?.verification_documents?.id_back

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-16">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Unified Dashboard Panel */}
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden divide-y divide-gray-100">

          {/* Section 1: User Identity Banner */}
          <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 bg-gradient-to-r from-gray-900 to-slate-800 text-white">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="bg-emerald-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                  {profile?.role.replace('_', ' ')}
                </span>
                {profile?.is_verified ? (
                  <span className="bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                    ✓ Verified Account
                  </span>
                ) : (
                  <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                    Under Review / Pending
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                {profile?.full_name || 'Account Settings'}
              </h1>
              <p className="text-xs text-gray-300 font-mono">
                {profile?.email}
              </p>
            </div>

            <Link
              href="/account/upgrade"
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold px-5 py-3.5 rounded-xl transition shadow-md w-full sm:w-auto text-center cursor-pointer shrink-0"
            >
              {isPartner ? 'Update Partner Details & ID →' : 'Apply to Become a Partner →'}
            </Link>
          </div>

          {/* Section 2: Contact & Account Metadata */}
          <div className="p-6 sm:p-8 space-y-4">
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-wider">
              Account & Contact Credentials
            </h2>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
              <div className="flex flex-col space-y-1">
                <dt className="text-gray-400 font-semibold">Mobile Money Line</dt>
                <dd className="font-mono font-bold text-gray-900 text-sm">
                  {profile?.phone_number || '—'}
                </dd>
              </div>

              <div className="flex flex-col space-y-1">
                <dt className="text-gray-400 font-semibold">WhatsApp Dispatch Number</dt>
                <dd className="font-mono font-bold text-emerald-700 text-sm">
                  {profile?.whatsapp_number || '—'}
                </dd>
              </div>

              {profile?.verification_documents?.business_name && (
                <div className="flex flex-col space-y-1 sm:col-span-2">
                  <dt className="text-gray-400 font-semibold">Business / Agency Name</dt>
                  <dd className="font-bold text-gray-900 text-sm">
                    {profile.verification_documents.business_name}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Section 3: Identity Verification Audit */}
          <div className="p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xs font-black text-gray-400 uppercase tracking-wider">
                  National ID Verification Audit
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Official identification records uploaded for compliance
                </p>
              </div>
              <div className="font-mono font-extrabold text-xs bg-gray-100 text-gray-800 px-3 py-1 rounded-lg border border-gray-200">
                NIN: {profile?.verification_documents?.nin_number || 'Not Provided'}
              </div>
            </div>

            {/* Document Snapshots Preview Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
              {/* Front Image */}
              <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50/50 space-y-2">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  National ID (Front Image)
                </div>
                {frontDoc ? (
                  <div className="rounded-xl overflow-hidden border border-gray-200 bg-black h-40">
                    <img src={frontDoc} alt="National ID Front" className="w-full h-full object-contain" />
                  </div>
                ) : (
                  <div className="h-40 rounded-xl border border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-400 italic bg-white">
                    No Front Photo Uploaded
                  </div>
                )}
              </div>

              {/* Back Image */}
              <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50/50 space-y-2">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  National ID (Back Image)
                </div>
                {backDoc ? (
                  <div className="rounded-xl overflow-hidden border border-gray-200 bg-black h-40">
                    <img src={backDoc} alt="National ID Back" className="w-full h-full object-contain" />
                  </div>
                ) : (
                  <div className="h-40 rounded-xl border border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-400 italic bg-white">
                    No Back Photo Uploaded
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

      </main>
    </div>
  )
}
