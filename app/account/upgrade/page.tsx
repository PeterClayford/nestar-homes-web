'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { createClient } from '@/lib/supabase/client'

export default function UpgradeAccountPage() {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  
  const [selectedRole, setSelectedRole] = useState<'landlord' | 'property_manager' | 'broker'>('landlord')
  const [fullName, setFullName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [ninNumber, setNinNumber] = useState('')
  const [businessName, setBusinessName] = useState('')
  
  // Mandatory legal compliance checkbox state
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function loadUserProfile() {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, phone_number, role, verification_documents')
        .eq('id', user.id)
        .single()

      if (profile) {
        if (profile.full_name) setFullName(profile.full_name)
        if (profile.phone_number) setPhoneNumber(profile.phone_number)
        if (profile.verification_documents?.nin_number) {
          setNinNumber(profile.verification_documents.nin_number)
        }
      }
      setLoading(false)
    }

    loadUserProfile()
  }, [supabase, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Explicit Validation Check for Mandatory Fields
    if (!fullName.trim() || !phoneNumber.trim() || !ninNumber.trim()) {
      setErrorMsg('Full Name, Mobile Money Phone Number, and National ID (NIN) are required.')
      return
    }

    if (!agreedToTerms) {
      setErrorMsg('You must agree to the legal declaration before submitting.')
      return
    }

    setSubmitting(true)
    setErrorMsg('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setErrorMsg('Session expired. Please sign in again.')
      setSubmitting(false)
      return
    }

    const updatedDocs = {
      nin_number: ninNumber.trim(),
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim(),
        phone_number: phoneNumber.trim(),
        role: selectedRole,
        verification_documents: updatedDocs,
        status_reason: `Partner Application submitted for ${selectedRole.toUpperCase()} (NIN: ${ninNumber.trim()}, Business: ${businessName || 'N/A'}, Terms Signed: YES)`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (error) {
      console.error('Upgrade submission error:', error)
      setErrorMsg(error.message || 'Failed to submit partner application.')
    } else {
      setSuccess(true)
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans">
        <Navbar />
        <div className="max-w-xl mx-auto px-4 py-20 text-center text-xs font-semibold text-gray-400">
          Loading partner application...
        </div>
      </div>
    )
  }

  const isFormValid = fullName.trim() !== '' && phoneNumber.trim() !== '' && ninNumber.trim() !== '' && agreedToTerms

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              Partner Application
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Apply to become a verified Landlord, Property Manager, or Broker on Nestar Homes
            </p>
          </div>

          {success ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-3">
              <div className="text-2xl">🎉</div>
              <h3 className="text-sm font-extrabold text-emerald-900">
                Application Submitted Successfully!
              </h3>
              <p className="text-xs text-emerald-700 leading-relaxed">
                Your profile has been updated to <strong className="uppercase">{selectedRole}</strong>. You can now proceed to list verified properties across Kampala & Wakiso.
              </p>
              <button
                onClick={() => router.push('/')}
                className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer"
              >
                Return to Dashboard
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {errorMsg && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-4 rounded-xl font-semibold">
                  {errorMsg}
                </div>
              )}

              {/* Role Selection Tabs */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Select Partner Role <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['landlord', 'property_manager', 'broker'] as const).map((role) => (
                    <button
                      type="button"
                      key={role}
                      onClick={() => setSelectedRole(role)}
                      className={`py-3 px-3 rounded-2xl text-xs font-extrabold capitalize border transition text-center cursor-pointer ${
                        selectedRole === role
                          ? 'bg-gray-900 text-white border-gray-900 shadow-sm'
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                      }`}
                    >
                      {role.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  Full Name / Contact Person <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Peter Anderson"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-xs font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-gray-50/50"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  Mobile Money Phone Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="e.g. 0777699468"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-xs font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-gray-50/50"
                />
              </div>

              {/* Business Name (Optional) */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  Business / Agency Name <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Trinity Graphix & Real Estate"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-xs font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-gray-50/50"
                />
              </div>

              {/* NIN Identification */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  National ID (NIN) / Identification Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={ninNumber}
                  onChange={(e) => setNinNumber(e.target.value)}
                  placeholder="e.g. CM12345678910"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-xs font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-gray-50/50"
                />
              </div>

              {/* Legal Declaration Checkbox Requirement */}
              <div className="pt-2">
                <label className="flex items-start gap-3 p-4 rounded-2xl border border-gray-200 bg-gray-50/50 hover:bg-gray-100/50 transition cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded accent-emerald-600 border-gray-300 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span className="text-xs text-gray-700 font-medium leading-relaxed">
                    I agree that the information provided is accurate and I own or manage the listed properties legally. <span className="text-rose-500">*</span>
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || !isFormValid}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-extrabold text-xs py-3.5 rounded-xl transition shadow-sm cursor-pointer mt-2"
              >
                {submitting ? 'Submitting Application...' : 'Submit Partner Application'}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  )
}
