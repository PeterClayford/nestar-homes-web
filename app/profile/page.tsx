'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { createClient } from '@/lib/supabase/client'

interface UserProfile {
  id: string
  email: string
  full_name?: string
  phone_number?: string
  role: string
  status: string
  is_verified: boolean
  verification_documents?: {
    nin_number?: string
    nin_front_url?: string
    nin_back_url?: string
  }
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [ninInput, setNinInput] = useState('')
  const [message, setMessage] = useState('')

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { data } = await supabase
      .from('profiles')
      .select('id, email, full_name, phone_number, role, status, is_verified, verification_documents')
      .eq('id', user.id)
      .single()

    if (data) {
      setProfile(data as UserProfile)
      if (data.verification_documents?.nin_number) {
        setNinInput(data.verification_documents.nin_number)
      }
    }
    setLoading(false)
  }

  // Calculate Verification Completion Percentage
  const calculateCompletion = () => {
    if (!profile) return 0
    let points = 25 // Account exists
    if (profile.phone_number && profile.role !== 'client') points += 25
    if (profile.verification_documents?.nin_number) points += 25
    if (profile.is_verified) points += 25
    return points
  }

  const handleSaveNIN = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return
    setUploading(true)

    const updatedDocs = {
      ...(profile.verification_documents || {}),
      nin_number: ninInput,
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        verification_documents: updatedDocs,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id)

    if (!error) {
      setMessage('NIN Details saved successfully!')
      fetchProfile()
    } else {
      setMessage('Failed to update NIN details.')
    }
    setUploading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans">
        <Navbar />
        <div className="max-w-xl mx-auto px-4 py-20 text-center text-xs font-semibold text-gray-400">
          Loading profile security hub...
        </div>
      </div>
    )
  }

  const completionScore = calculateCompletion()

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-10 space-y-6">
        
        {/* Header Block */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                  {profile?.full_name || 'Partner Profile'}
                </h1>
                <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-gray-100 text-gray-700 border border-gray-200">
                  {profile?.role?.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">{profile?.email}</p>
            </div>

            {profile?.is_verified ? (
              <span className="bg-emerald-600 text-white text-[10px] font-extrabold px-3 py-1.5 rounded-full uppercase tracking-wider self-start md:self-auto">
                ✓ Fully Verified Partner
              </span>
            ) : (
              <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-extrabold px-3 py-1.5 rounded-full uppercase tracking-wider self-start md:self-auto">
                Verification In Progress
              </span>
            )}
          </div>

          {/* Progress Bar Widget */}
          <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-gray-700 uppercase text-[10px] tracking-wider">
                Partner Verification Status
              </span>
              <span className="font-black text-emerald-600">{completionScore}% Completed</span>
            </div>
            
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-600 transition-all duration-500 rounded-full"
                style={{ width: `${completionScore}%` }}
              ></div>
            </div>

            <p className="text-[11px] text-gray-400 pt-1">
              {completionScore === 100
                ? 'Your account is fully verified. Your property listings carry the verified trust badge.'
                : completionScore >= 75
                ? 'Phase 2 complete! Upload your NIN photos below to request final Admin verification.'
                : 'Complete Phase 1 & 2 below to increase tenant lead conversions.'}
            </p>
          </div>
        </div>

        {/* Phase 1 & 2 Interactive Form */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-gray-900">Tier 2: Progressive Identification</h2>
          
          {message && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs p-3 rounded-xl font-semibold">
              {message}
            </div>
          )}

          <form onSubmit={handleSaveNIN} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                National Identification Number (NIN)
              </label>
              <input
                type="text"
                required
                value={ninInput}
                onChange={(e) => setNinInput(e.target.value)}
                placeholder="e.g. CM12345678910"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-xs font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-gray-50/50"
              />
            </div>

            {/* Photo Upload Placeholders */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 border-2 border-dashed border-gray-200 rounded-2xl text-center space-y-2 bg-gray-50/50">
                <div className="text-xs font-bold text-gray-700">NIN Card Front Photo</div>
                <p className="text-[10px] text-gray-400">Clear snapshot of card front</p>
                <button
                  type="button"
                  className="px-3 py-1.5 bg-gray-900 text-white rounded-xl text-[10px] font-bold"
                >
                  Upload Front
                </button>
              </div>

              <div className="p-4 border-2 border-dashed border-gray-200 rounded-2xl text-center space-y-2 bg-gray-50/50">
                <div className="text-xs font-bold text-gray-700">NIN Card Back Photo</div>
                <p className="text-[10px] text-gray-400">Clear snapshot of card back</p>
                <button
                  type="button"
                  className="px-3 py-1.5 bg-gray-900 text-white rounded-xl text-[10px] font-bold"
                >
                  Upload Back
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white font-extrabold text-xs py-3.5 rounded-xl transition shadow-sm cursor-pointer mt-4"
            >
              {uploading ? 'Updating Profile...' : 'Save Verification Details'}
            </button>
          </form>
        </div>

      </main>
    </div>
  )
}
