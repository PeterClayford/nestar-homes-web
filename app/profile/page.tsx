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
          Loading profile details...
        </div>
      </div>
    )
  }

  const isPartner = ['landlord', 'property_manager', 'broker', 'admin', 'tech_auditor'].includes(profile?.role || '')

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-12">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* Profile Header */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider border border-emerald-200">
                {profile?.role.replace('_', ' ')}
              </span>
              {profile?.is_verified && (
                <span className="bg-emerald-600 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wide">
                  ✓ Verified Account
                </span>
              )}
            </div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              {profile?.full_name || 'Account Overview'}
            </h1>
            <p className="text-xs text-gray-400 font-mono mt-0.5">
              {profile?.email}
            </p>
          </div>

          <Link
            href="/account/upgrade"
            className="bg-gray-900 hover:bg-gray-800 text-white text-xs font-extrabold px-5 py-3 rounded-xl transition shadow-sm w-full sm:w-auto text-center"
          >
            {isPartner ? 'Update Partner Details & ID →' : 'Apply to Become a Partner →'}
          </Link>
        </div>

        {/* Contact Information Summary */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">
            Account Contact Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 space-y-1">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Mobile Money Phone
              </div>
              <div className="font-mono font-extrabold text-gray-900">
                {profile?.phone_number || 'Not Set'}
              </div>
            </div>

            <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 space-y-1">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                WhatsApp Dispatch Line
              </div>
              <div className="font-mono font-extrabold text-emerald-700">
                {profile?.whatsapp_number || 'Not Set'}
              </div>
            </div>
          </div>
        </div>

        {/* Verification & Identification Overview */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">
              Identification & Verification
            </h2>
            <span
              className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                profile?.is_verified
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              {profile?.is_verified ? '✓ Audit Complete' : 'Under Review / Unverified'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-2">
            <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 space-y-1">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">National ID (NIN)</div>
              <div className="font-mono font-bold text-gray-900">
                {profile?.verification_documents?.nin_number || 'Not Provided'}
              </div>
            </div>

            <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 space-y-1">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Front ID Snapshot</div>
              <div className="font-bold text-emerald-600">
                {profile?.verification_documents?.id_front ? '✓ Uploaded' : 'Missing'}
              </div>
            </div>

            <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 space-y-1">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Back ID Snapshot</div>
              <div className="font-bold text-emerald-600">
                {profile?.verification_documents?.id_back ? '✓ Uploaded' : 'Missing'}
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}
