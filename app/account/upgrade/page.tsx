'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { createClient } from '@/lib/supabase/client'

export default function UpgradeAccountPage() {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const [selectedRole, setSelectedRole] = useState<'landlord' | 'property_manager' | 'broker'>('landlord')
  const [fullName, setFullName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [sameAsPhone, setSameAsPhone] = useState(true)
  const [ninNumber, setNinNumber] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  // File states for National ID Front & Back
  const [idFrontFile, setIdFrontFile] = useState<File | null>(null)
  const [idBackFile, setIdBackFile] = useState<File | null>(null)
  const [idFrontUrl, setIdFrontUrl] = useState('')
  const [idBackUrl, setIdBackUrl] = useState('')

  const supabase = createClient()
  const router = useRouter()

  const validateUgandanPhone = (phone: string): boolean => {
    const cleaned = phone.trim().replace(/[\s\-\+\(\)]/g, '')
    const localRegex = /^07\d{8}$/
    const intlRegex = /^2567\d{8}$/
    return localRegex.test(cleaned) || intlRegex.test(cleaned)
  }

  const validateInternationalPhone = (phone: string): boolean => {
    const cleaned = phone.trim().replace(/[\s\-\+\(\)]/g, '')
    return /^\d{7,15}$/.test(cleaned)
  }

  const sanitizePhoneNumber = (phone: string, isLocalOnly = false): string => {
    let cleaned = phone.trim().replace(/[\s\-\+\(\)]/g, '')
    if (cleaned.startsWith('07')) {
      cleaned = '256' + cleaned.substring(1)
    }
    return cleaned
  }

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
        .select('full_name, phone_number, whatsapp_number, role, verification_documents')
        .eq('id', user.id)
        .single()

      if (profile) {
        if (profile.full_name) setFullName(profile.full_name)
        if (profile.phone_number) {
          setPhoneNumber(profile.phone_number)
          if (!profile.whatsapp_number) setWhatsappNumber(profile.phone_number)
        }
        if (profile.whatsapp_number) {
          setWhatsappNumber(profile.whatsapp_number)
          if (profile.whatsapp_number !== profile.phone_number) setSameAsPhone(false)
        }
        if (profile.verification_documents?.nin_number) {
          setNinNumber(profile.verification_documents.nin_number)
        }
        if (profile.verification_documents?.id_front) {
          setIdFrontUrl(profile.verification_documents.id_front)
        }
        if (profile.verification_documents?.id_back) {
          setIdBackUrl(profile.verification_documents.id_back)
        }
      }
      setLoading(false)
    }

    loadUserProfile()
  }, [supabase, router])

  const handlePhoneChange = (val: string) => {
    setPhoneNumber(val)
    if (sameAsPhone) {
      setWhatsappNumber(val)
    }
  }

  const handleSameAsPhoneToggle = (checked: boolean) => {
    setSameAsPhone(checked)
    if (checked) {
      setWhatsappNumber(phoneNumber)
    }
  }

  const uploadFile = async (file: File, folder: string, userId: string): Promise<string> => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${folder}_${Date.now()}.${fileExt}`
    
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, file, { upsert: true })

    if (uploadError) {
      throw new Error(`Failed to upload ${folder} document: ${uploadError.message}`)
    }

    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(fileName)

    return publicUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanedPhone = sanitizePhoneNumber(phoneNumber, true)
    const rawWhatsApp = sameAsPhone ? phoneNumber : whatsappNumber
    const cleanedWhatsApp = sanitizePhoneNumber(rawWhatsApp, false)

    if (!fullName.trim() || !cleanedPhone || !cleanedWhatsApp || !ninNumber.trim()) {
      setErrorMsg('Full Name, Mobile Money Phone, WhatsApp Number, and National ID (NIN) are required.')
      return
    }

    if (!validateUgandanPhone(phoneNumber)) {
      setErrorMsg('Invalid Mobile Money number. Please enter a valid Ugandan number starting with 07 or 2567.')
      return
    }

    if (!validateInternationalPhone(rawWhatsApp)) {
      setErrorMsg('Invalid WhatsApp number. Please enter a valid phone number with country code (e.g. +971... or +44... or 07...).')
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

    let uploadedFrontUrl = idFrontUrl
    let uploadedBackUrl = idBackUrl

    try {
      if (idFrontFile) {
        uploadedFrontUrl = await uploadFile(idFrontFile, 'id_front', user.id)
      }
      if (idBackFile) {
        uploadedBackUrl = await uploadFile(idBackFile, 'id_back', user.id)
      }
    } catch (err: any) {
      console.error('File upload error:', err)
      setErrorMsg(err.message || 'Error uploading identification files.')
      setSubmitting(false)
      return
    }

    const updatedDocs = {
      nin_number: ninNumber.trim(),
      id_front: uploadedFrontUrl,
      id_back: uploadedBackUrl,
      business_name: businessName.trim(),
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim(),
        phone_number: cleanedPhone,
        whatsapp_number: cleanedWhatsApp,
        role: selectedRole,
        verification_documents: updatedDocs,
        status_reason: `Application submitted for ${selectedRole.toUpperCase()} (NIN: ${ninNumber.trim()})`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (error) {
      console.error('Upgrade submission error:', error)
      setErrorMsg(error.message || 'Failed to submit partner application.')
      setSubmitting(false)
    } else {
      router.push('/profile?application=submitted')
    }
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

  const isPhoneValid = validateUgandanPhone(phoneNumber)
  const isWhatsAppValid = validateInternationalPhone(whatsappNumber)
  const isFormValid = fullName.trim() !== '' && isPhoneValid && isWhatsAppValid && ninNumber.trim() !== '' && agreedToTerms

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase">
                Verification Pipeline
              </span>
            </div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              Partner Application
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Apply to become a verified Landlord, Property Manager, or Broker on Nestar Homes
            </p>
          </div>

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

            {/* Mobile Money Phone Number */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Mobile Money Phone Number <span className="text-rose-500">*</span>
                </label>
                {phoneNumber && !isPhoneValid && (
                  <span className="text-[10px] font-bold text-rose-500">
                    Must start with 07 or 2567
                  </span>
                )}
              </div>
              <input
                type="tel"
                required
                value={phoneNumber}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="e.g. 0777699468 or 256705485667"
                className={`w-full px-4 py-3 rounded-xl border text-xs font-semibold text-gray-900 focus:outline-none focus:ring-2 bg-gray-50/50 ${
                  phoneNumber && !isPhoneValid
                    ? 'border-rose-300 focus:ring-rose-500'
                    : 'border-gray-200 focus:ring-emerald-600'
                }`}
              />
            </div>

            {/* Dedicated WhatsApp Number */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  WhatsApp Contact Number <span className="text-rose-500">*</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sameAsPhone}
                    onChange={(e) => handleSameAsPhoneToggle(e.target.checked)}
                    className="h-3.5 w-3.5 rounded accent-emerald-600 border-gray-300"
                  />
                  <span className="text-[10px] font-semibold text-gray-600">Same as Phone Number</span>
                </label>
              </div>

              {!sameAsPhone && (
                <input
                  type="tel"
                  required
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="e.g. +971501234567, +447911123456, or 0705485667"
                  className={`w-full px-4 py-3 rounded-xl border text-xs font-semibold text-gray-900 focus:outline-none focus:ring-2 bg-gray-50/50 ${
                    whatsappNumber && !isWhatsAppValid
                      ? 'border-rose-300 focus:ring-rose-500'
                      : 'border-gray-200 focus:ring-emerald-600'
                  }`}
                />
              )}
            </div>

            {/* Business Name */}
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
                National ID (NIN) Number <span className="text-rose-500">*</span>
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

            {/* National ID Upload Section */}
            <div className="pt-2 border-t border-gray-100 space-y-4">
              <div>
                <h3 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider">
                  Identity Verification Documents
                </h3>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Upload clear photos of your National ID or Passport for account audit.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* ID Front */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    National ID (Front Image)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && setIdFrontFile(e.target.files[0])}
                    className="w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-extrabold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                  />
                  {idFrontUrl && !idFrontFile && (
                    <p className="text-[10px] text-emerald-600 font-bold">✓ Front ID image attached</p>
                  )}
                </div>

                {/* ID Back */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    National ID (Back Image)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && setIdBackFile(e.target.files[0])}
                    className="w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-extrabold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                  />
                  {idBackUrl && !idBackFile && (
                    <p className="text-[10px] text-emerald-600 font-bold">✓ Back ID image attached</p>
                  )}
                </div>
              </div>
            </div>

            {/* Legal Declaration */}
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
              {submitting ? 'Uploading Documents & Submitting...' : 'Submit Partner Application →'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
