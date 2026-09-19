'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { createClient } from '@/lib/supabase/client'

interface UserProfile {
  id: string
  email: string
  full_name?: string
  phone_number?: string
  whatsapp_number?: string
  whatsapp_verified?: boolean
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
  const [savingContact, setSavingContact] = useState(false)
  
  // Contact Form State
  const [fullNameInput, setFullNameInput] = useState('')
  const [phoneInput, setPhoneInput] = useState('')
  const [whatsappInput, setWhatsappInput] = useState('')
  const [sameAsPhone, setSameAsPhone] = useState(true)
  const [contactMessage, setContactMessage] = useState('')

  // Verification Form State
  const [ninInput, setNinInput] = useState('')
  const [message, setMessage] = useState('')

  const [frontPreview, setFrontPreview] = useState<string | null>(null)
  const [backPreview, setBackPreview] = useState<string | null>(null)

  const [cameraActive, setCameraActive] = useState<'front' | 'back' | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

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
      .select('id, email, full_name, phone_number, whatsapp_number, whatsapp_verified, role, status, is_verified, verification_documents')
      .eq('id', user.id)
      .single()

    if (data) {
      setProfile(data as UserProfile)
      if (data.full_name) setFullNameInput(data.full_name)
      if (data.phone_number) setPhoneInput(data.phone_number)
      if (data.whatsapp_number) {
        setWhatsappInput(data.whatsapp_number)
        if (data.whatsapp_number !== data.phone_number) setSameAsPhone(false)
      } else if (data.phone_number) {
        setWhatsappInput(data.phone_number)
      }

      if (data.verification_documents?.nin_number) {
        setNinInput(data.verification_documents.nin_number)
      }
      if (data.verification_documents?.nin_front_url) {
        setFrontPreview(data.verification_documents.nin_front_url)
      }
      if (data.verification_documents?.nin_back_url) {
        setBackPreview(data.verification_documents.nin_back_url)
      }
    }
    setLoading(false)
  }

  const handlePhoneChange = (val: string) => {
    setPhoneInput(val)
    if (sameAsPhone) {
      setWhatsappInput(val)
    }
  }

  const handleSameAsPhoneToggle = (checked: boolean) => {
    setSameAsPhone(checked)
    if (checked) {
      setWhatsappInput(phoneInput)
    }
  }

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return
    setSavingContact(true)
    setContactMessage('')

    const cleanedPhone = sanitizePhoneNumber(phoneInput, true)
    const rawWhatsApp = sameAsPhone ? phoneInput : whatsappInput
    const cleanedWhatsApp = sanitizePhoneNumber(rawWhatsApp, false)

    if (phoneInput && !validateUgandanPhone(phoneInput)) {
      setContactMessage('Invalid Mobile Money phone number. Must start with 07 or 2567.')
      setSavingContact(false)
      return
    }

    if (rawWhatsApp && !validateInternationalPhone(rawWhatsApp)) {
      setContactMessage('Invalid WhatsApp number. Please enter a valid number with country code (e.g. +971..., +44..., or 07...).')
      setSavingContact(false)
      return
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullNameInput.trim(),
        phone_number: cleanedPhone,
        whatsapp_number: cleanedWhatsApp,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id)

    if (!error) {
      setContactMessage('Contact details updated successfully!')
      fetchProfile()
    } else {
      setContactMessage('Failed to update contact details.')
    }
    setSavingContact(false)
  }

  const calculateCompletion = () => {
    if (!profile) return 0
    if (profile.is_verified) return 100

    let points = 20
    if (profile.phone_number) points += 20
    if (profile.whatsapp_number) points += 20
    if (profile.verification_documents?.nin_number || ninInput) points += 20
    if (frontPreview || backPreview) points += 20
    return points
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      if (side === 'front') setFrontPreview(reader.result as string)
      if (side === 'back') setBackPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const startCamera = async (side: 'front' | 'back') => {
    setCameraActive(side)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (err) {
      console.error('Camera access error:', err)
      alert('Could not access camera. Please allow camera permissions or upload a file instead.')
      setCameraActive(null)
    }
  }

  const capturePhoto = () => {
    if (!videoRef.current || !cameraActive) return

    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth || 640
    canvas.height = videoRef.current.videoHeight || 480
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
      const dataUrl = canvas.toDataURL('image/jpeg')
      if (cameraActive === 'front') setFrontPreview(dataUrl)
      if (cameraActive === 'back') setBackPreview(dataUrl)
    }
    stopCamera()
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setCameraActive(null)
  }

  const handleSaveVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return
    setUploading(true)

    const updatedDocs = {
      ...(profile.verification_documents || {}),
      nin_number: ninInput,
      nin_front_url: frontPreview || profile.verification_documents?.nin_front_url,
      nin_back_url: backPreview || profile.verification_documents?.nin_back_url,
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        verification_documents: updatedDocs,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id)

    if (!error) {
      setMessage('NIN Verification details and ID images saved successfully!')
      fetchProfile()
    } else {
      setMessage('Failed to update verification details.')
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
  const isApproved = profile?.is_verified

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
                  {profile?.full_name || 'User Profile'}
                </h1>
                <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-gray-100 text-gray-700 border border-gray-200">
                  {profile?.role?.replace('_', ' ') || 'CLIENT'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">{profile?.email}</p>
            </div>

            {isApproved ? (
              <span className="bg-emerald-600 text-white text-[10px] font-extrabold px-3 py-1.5 rounded-full uppercase tracking-wider self-start md:self-auto">
                ✓ Fully Verified Partner
              </span>
            ) : (
              <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-extrabold px-3 py-1.5 rounded-full uppercase tracking-wider self-start md:self-auto">
                Verification Pending
              </span>
            )}
          </div>

          {/* Progress Bar Widget */}
          <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-gray-700 uppercase text-[10px] tracking-wider">
                Account Verification Status
              </span>
              <span className="font-black text-emerald-600">{completionScore}% Completed</span>
            </div>

            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-600 transition-all duration-500 rounded-full"
                style={{ width: `${completionScore}%` }}
              ></div>
            </div>

            <p className="text-[11px] text-gray-600 font-medium pt-1">
              {isApproved
                ? 'Your identity documents have been verified and approved by Nestar Homes Administration.'
                : completionScore >= 80
                ? 'Phase 2 complete! Your uploaded ID is currently under Admin review.'
                : 'Complete Phase 1 & 2 below to unlock partner listing rights and trust badges.'}
            </p>
          </div>
        </div>

        {/* Contact Information & WhatsApp Details */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Personal & Contact Details</h2>
            {profile?.whatsapp_verified ? (
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase">
                ✓ WhatsApp Verified
              </span>
            ) : (
              <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase">
                WhatsApp Unverified
              </span>
            )}
          </div>

          <form onSubmit={handleSaveContact} className="space-y-4">
            {contactMessage && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs p-3 rounded-xl font-semibold">
                {contactMessage}
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                Full Name / Contact Person
              </label>
              <input
                type="text"
                required
                value={fullNameInput}
                onChange={(e) => setFullNameInput(e.target.value)}
                placeholder="e.g. Peter Anderson"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-xs font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-gray-50/50"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                Mobile Money Phone Number
              </label>
              <input
                type="tel"
                value={phoneInput}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="e.g. 0777699468 or 256705485667"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-xs font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-gray-50/50"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Dedicated WhatsApp Contact Line
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sameAsPhone}
                    onChange={(e) => handleSameAsPhoneToggle(e.target.checked)}
                    className="h-3.5 w-3.5 rounded accent-emerald-600 border-gray-300"
                  />
                  <span className="text-[10px] font-semibold text-gray-600">Same as Phone</span>
                </label>
              </div>

              {!sameAsPhone && (
                <input
                  type="tel"
                  value={whatsappInput}
                  onChange={(e) => setWhatsappInput(e.target.value)}
                  placeholder="e.g. +971501234567, +447911123456, or 0705485667"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-xs font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-gray-50/50"
                />
              )}
              <p className="text-[10px] text-gray-400">
                Supports local and international numbers (e.g. +971..., +44..., +254...). Used for dispatching lead notifications.
              </p>
            </div>

            <button
              type="submit"
              disabled={savingContact}
              className="bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 text-white font-extrabold text-xs px-5 py-3 rounded-xl transition shadow-sm cursor-pointer"
            >
              {savingContact ? 'Saving Contact Details...' : 'Update Contact Details'}
            </button>
          </form>
        </div>

        {/* Live Camera Viewfinder Modal */}
        {cameraActive && (
          <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 text-center">
              <h3 className="text-sm font-extrabold text-gray-900 capitalize">
                Snap NIN Card {cameraActive} Photo
              </h3>
              <div className="relative aspect-video bg-black rounded-2xl overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold px-5 py-2.5 rounded-xl transition"
                >
                  📸 Capture Photo
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold px-4 py-2.5 rounded-xl transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tier 2 ID Submission Form OR Approved Locked View */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-gray-900">Tier 2: Progressive Identification</h2>

          {isApproved ? (
            <div className="bg-emerald-50/60 border border-emerald-100 p-6 rounded-2xl space-y-3">
              <div className="flex items-center gap-3 text-emerald-900 font-extrabold text-sm">
                <span>🛡️</span> Identity Verification Secured
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed font-medium">
                Your National ID credentials have been verified. For security reasons, raw identification photos are hidden from the dashboard once approved.
              </p>
              <div className="pt-2 text-[11px] font-mono text-emerald-700 font-bold">
                Registered NIN: {ninInput ? `${ninInput.slice(0, 4)}****${ninInput.slice(-4)}` : 'VERIFIED'}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveVerification} className="space-y-6">
              {message && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs p-3 rounded-xl font-semibold">
                  {message}
                </div>
              )}

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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Card Front Block */}
                <div className="p-5 border-2 border-dashed border-gray-200 rounded-2xl text-center space-y-3 bg-gray-50/50">
                  <div className="text-xs font-bold text-gray-800">NIN Card Front Photo</div>

                  {frontPreview ? (
                    <div className="relative h-32 rounded-xl overflow-hidden border border-gray-200">
                      <img src={frontPreview} alt="NIN Front" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setFrontPreview(null)}
                        className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-md font-bold"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <p className="text-[10px] text-gray-400">Upload image file or snap live with camera</p>
                  )}

                  <div className="flex items-center justify-center gap-2 pt-1">
                    <label className="bg-gray-900 hover:bg-gray-800 text-white px-3 py-2 rounded-xl text-[10px] font-extrabold cursor-pointer transition">
                      📁 Choose File
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileSelect(e, 'front')}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => startCamera('front')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl text-[10px] font-extrabold transition"
                    >
                      📷 Use Camera
                    </button>
                  </div>
                </div>

                {/* Card Back Block */}
                <div className="p-5 border-2 border-dashed border-gray-200 rounded-2xl text-center space-y-3 bg-gray-50/50">
                  <div className="text-xs font-bold text-gray-800">NIN Card Back Photo</div>

                  {backPreview ? (
                    <div className="relative h-32 rounded-xl overflow-hidden border border-gray-200">
                      <img src={backPreview} alt="NIN Back" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setBackPreview(null)}
                        className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-md font-bold"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <p className="text-[10px] text-gray-400">Upload image file or snap live with camera</p>
                  )}

                  <div className="flex items-center justify-center gap-2 pt-1">
                    <label className="bg-gray-900 hover:bg-gray-800 text-white px-3 py-2 rounded-xl text-[10px] font-extrabold cursor-pointer transition">
                      📁 Choose File
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileSelect(e, 'back')}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => startCamera('back')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl text-[10px] font-extrabold transition"
                    >
                      📷 Use Camera
                    </button>
                  </div>
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
          )}
        </div>

      </main>
    </div>
  )
}
