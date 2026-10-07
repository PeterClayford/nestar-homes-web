'use client'

import { useEffect, useState, useRef } from 'react'
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

  // File & Preview states for National ID Front & Back
  const [idFrontFile, setIdFrontFile] = useState<File | null>(null)
  const [idBackFile, setIdBackFile] = useState<File | null>(null)
  const [frontPreview, setFrontPreview] = useState<string | null>(null)
  const [backPreview, setBackPreview] = useState<string | null>(null)

  // Camera State
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
        if (profile.verification_documents?.id_front || profile.verification_documents?.nin_front_url) {
          setFrontPreview(profile.verification_documents.id_front || profile.verification_documents.nin_front_url)
        }
        if (profile.verification_documents?.id_back || profile.verification_documents?.nin_back_url) {
          setBackPreview(profile.verification_documents.id_back || profile.verification_documents.nin_back_url)
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const file = e.target.files?.[0]
    if (!file) return

    if (side === 'front') setIdFrontFile(file)
    if (side === 'back') setIdBackFile(file)

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
      
      // Convert Data URL to File object for Supabase upload
      fetch(dataUrl)
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File([blob], `camera_${cameraActive}_${Date.now()}.jpg`, { type: 'image/jpeg' })
          if (cameraActive === 'front') {
            setIdFrontFile(file)
            setFrontPreview(dataUrl)
          } else {
            setIdBackFile(file)
            setBackPreview(dataUrl)
          }
        })
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

  const removeImage = (side: 'front' | 'back') => {
    if (side === 'front') {
      setIdFrontFile(null)
      setFrontPreview(null)
    } else {
      setIdBackFile(null)
      setBackPreview(null)
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

    let uploadedFrontUrl = frontPreview || ''
    let uploadedBackUrl = backPreview || ''

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
      nin_front_url: uploadedFrontUrl,
      nin_back_url: uploadedBackUrl,
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
    <div className="min-h-screen bg-gray-50 font-sans pb-16">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 py-12">

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
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold px-5 py-2.5 rounded-xl transition cursor-pointer"
                >
                  📸 Capture Photo
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold px-4 py-2.5 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

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

            {/* National ID Upload & Dual-Mode Camera Section */}
            <div className="pt-2 border-t border-gray-100 space-y-4">
              <div>
                <h3 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider">
                  Identity Verification Documents
                </h3>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Upload clear photos or snap live photos with your camera for account audit.
                </p>
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
                        onClick={() => removeImage('front')}
                        className="absolute top-2 right-2 bg-black/60 hover:bg-rose-600 text-white text-[10px] px-2 py-0.5 rounded-md font-bold transition cursor-pointer"
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
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl text-[10px] font-extrabold transition cursor-pointer"
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
                        onClick={() => removeImage('back')}
                        className="absolute top-2 right-2 bg-black/60 hover:bg-rose-600 text-white text-[10px] px-2 py-0.5 rounded-md font-bold transition cursor-pointer"
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
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl text-[10px] font-extrabold transition cursor-pointer"
                    >
                      📷 Use Camera
                    </button>
                  </div>
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
