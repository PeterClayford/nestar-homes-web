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
    nin_front_url?: string
    nin_back_url?: string
  }
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [sameAsPhone, setSameAsPhone] = useState(false)
  const [ninNumber, setNinNumber] = useState('')
  const [idFrontFile, setIdFrontFile] = useState<File | null>(null)
  const [idBackFile, setIdBackFile] = useState<File | null>(null)
  const [savingDocs, setSavingDocs] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)

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

        if (data) {
          setProfile(data as UserProfile)
          if (data.whatsapp_number) setWhatsappNumber(data.whatsapp_number)
          if (data.verification_documents?.nin_number) setNinNumber(data.verification_documents.nin_number)
        }
      }
      setLoading(false)
    }

    loadProfile()
  }, [supabase])

  const handleUpdateWhatsApp = async () => {
    if (!profile) return
    setMessage(null)

    const targetWhatsApp = sameAsPhone ? (profile.phone_number || '') : whatsappNumber

    const { error } = await supabase
      .from('profiles')
      .update({
        whatsapp_number: targetWhatsApp,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id)

    if (error) {
      setMessage({ type: 'error', text: `Failed to update WhatsApp number: ${error.message}` })
    } else {
      setMessage({ type: 'success', text: 'WhatsApp contact line updated successfully!' })
      setProfile({ ...profile, whatsapp_number: targetWhatsApp })
    }
  }

  const handleSaveTier2Docs = async () => {
    if (!profile) return
    setSavingDocs(true)
    setMessage(null)

    try {
      let frontUrl = profile.verification_documents?.id_front || profile.verification_documents?.nin_front_url || ''
      let backUrl = profile.verification_documents?.id_back || profile.verification_documents?.nin_back_url || ''

      if (idFrontFile) {
        const fileExt = idFrontFile.name.split('.').pop()
        const fileName = `${profile.id}/id_front_${Date.now()}.${fileExt}`
        const { error: upErr } = await supabase.storage.from('documents').upload(fileName, idFrontFile, { upsert: true })
        if (!upErr) {
          const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(fileName)
          frontUrl = publicUrl
        }
      }

      if (idBackFile) {
        const fileExt = idBackFile.name.split('.').pop()
        const fileName = `${profile.id}/id_back_${Date.now()}.${fileExt}`
        const { error: upErr } = await supabase.storage.from('documents').upload(fileName, idBackFile, { upsert: true })
        if (!upErr) {
          const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(fileName)
          backUrl = publicUrl
        }
      }

      const updatedDocs = {
        ...profile.verification_documents,
        nin_number: ninNumber.trim(),
        id_front: frontUrl,
        id_back: backUrl,
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          verification_documents: updatedDocs,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id)

      if (error) {
        setMessage({ type: 'error', text: `Failed to save identification: ${error.message}` })
      } else {
        setMessage({ type: 'success', text: 'Tier 2 identification details saved successfully!' })
        setProfile({ ...profile, verification_documents: updatedDocs })
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error saving verification files.' })
    }

    setSavingDocs(false)
  }

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

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-16">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {message && (
          <div
            className={`p-4 rounded-2xl text-xs font-semibold ${
              message.type === 'error'
                ? 'bg-rose-50 text-rose-700 border border-rose-100'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* User Identity Banner */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                {profile?.role.replace('_', ' ')}
              </span>
            </div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              {profile?.full_name || 'Account Overview'}
            </h1>
            <p className="text-xs text-gray-400 font-mono">
              {profile?.email}
            </p>
          </div>

          <Link
            href="/account/upgrade"
            className="bg-gray-900 hover:bg-gray-800 text-white text-xs font-extrabold px-5 py-3 rounded-xl transition shadow-sm text-center"
          >
            Apply to Become a Partner →
          </Link>
        </div>

        {/* Card 1: Account & WhatsApp Line */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black text-gray-900 uppercase tracking-wider">
              Account & WhatsApp Line
            </h2>
            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider border border-emerald-200">
              ✓ WhatsApp Verified
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-gray-50 rounded-2xl space-y-1">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                Full Name / Legal Entity 🔒
              </div>
              <div className="font-bold text-gray-900">
                {profile?.full_name || '—'}
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-2xl space-y-1">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                Mobile Money Contact 🔒
              </div>
              <div className="font-mono font-bold text-gray-900">
                {profile?.phone_number || '—'}
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Dedicated WhatsApp Contact Line
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sameAsPhone}
                  onChange={(e) => setSameAsPhone(e.target.checked)}
                  className="h-3.5 w-3.5 rounded accent-emerald-600 border-gray-300"
                />
                <span className="text-[10px] font-semibold text-gray-600">Same as Mobile Money Line</span>
              </label>
            </div>

            {!sameAsPhone && (
              <input
                type="tel"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="e.g. +256705485667"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-xs font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-gray-50/50"
              />
            )}

            <p className="text-[10px] text-gray-400">
              Supports local and international numbers (e.g. +971..., +44..., +254...). Used for dispatching lead notifications.
            </p>

            <button
              onClick={handleUpdateWhatsApp}
              className="bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition cursor-pointer"
            >
              Update WhatsApp Line
            </button>
          </div>
        </div>

        {/* Card 2: Tier 2: Progressive Identification */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-5">
          <h2 className="text-xs font-black text-gray-900 uppercase tracking-wider">
            Tier 2: Progressive Identification
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                National Identification Number (NIN)
              </label>
              <input
                type="text"
                value={ninNumber}
                onChange={(e) => setNinNumber(e.target.value)}
                placeholder="e.g. CM12345678910"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-xs font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-gray-50/50"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-center space-y-2">
                <div className="text-[10px] font-bold text-gray-600 uppercase">NIN Card Front Photo</div>
                <p className="text-[9px] text-gray-400">Upload image file or snap live with camera</p>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <label className="bg-gray-900 hover:bg-gray-800 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg cursor-pointer transition">
                    Choose File
                    <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && setIdFrontFile(e.target.files[0])} className="hidden" />
                  </label>
                  <span className="bg-emerald-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg cursor-pointer">
                    Use Camera
                  </span>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-center space-y-2">
                <div className="text-[10px] font-bold text-gray-600 uppercase">NIN Card Back Photo</div>
                <p className="text-[9px] text-gray-400">Upload image file or snap live with camera</p>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <label className="bg-gray-900 hover:bg-gray-800 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg cursor-pointer transition">
                    Choose File
                    <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && setIdBackFile(e.target.files[0])} className="hidden" />
                  </label>
                  <span className="bg-emerald-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg cursor-pointer">
                    Use Camera
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleSaveTier2Docs}
              disabled={savingDocs}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold py-3.5 rounded-xl transition cursor-pointer shadow-sm mt-2"
            >
              {savingDocs ? 'Saving Identification...' : 'Save Verification Details'}
            </button>
          </div>
        </div>

      </main>
    </div>
  )
}
