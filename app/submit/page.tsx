'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface GeographicNode {
  id: string
  name: string
}

export default function SubmitPropertyPage() {
  const router = useRouter()
  const supabase = createClient()

  const cameraInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  const [districts, setDistricts] = useState<GeographicNode[]>([])
  const [loadingDistricts, setLoadingDistricts] = useState(true)

  const [isCustomDistrict, setIsCustomDistrict] = useState(false)
  const [isCustomTown, setIsCustomTown] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    district_id: '',
    custom_district: '',
    town_name: 'Sonde',
    custom_town: '',
    village_name: '',
    rent_amount: '',
    currency: 'UGX',
    description: '',
  })

  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])

  useEffect(() => {
    async function fetchDistricts() {
      try {
        const { data, error } = await supabase
          .from('geographic_nodes')
          .select('id, name')
          .order('name', { ascending: true })

        if (!error && data) {
          setDistricts(data as GeographicNode[])
        }
      } catch (err) {
        console.error('Error fetching districts:', err)
      } finally {
        setLoadingDistricts(false)
      }
    }

    fetchDistricts()
  }, [supabase])

  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.src = URL.createObjectURL(file)
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX_WIDTH = 1200
        let width = img.width
        let height = img.height

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width)
          width = MAX_WIDTH
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob)
            else reject(new Error('Image compression failed'))
          },
          'image/webp',
          0.8
        )
      }
      img.onerror = (err) => reject(err)
    })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      const updatedFiles = [...selectedFiles, ...newFiles]
      setSelectedFiles(updatedFiles)

      const updatedPreviews = updatedFiles.map((file) => URL.createObjectURL(file))
      setPreviews(updatedPreviews)
    }
  }

  const removePhoto = (indexToRemove: number) => {
    const updatedFiles = selectedFiles.filter((_, idx) => idx !== indexToRemove)
    setSelectedFiles(updatedFiles)

    const updatedPreviews = updatedFiles.map((file) => URL.createObjectURL(file))
    setPreviews(updatedPreviews)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isCustomDistrict && !formData.district_id) {
      setError('Please select a District / City from the list or add a custom one.')
      return
    }

    setLoading(true)
    setError(null)
    setUploadStatus('Compressing images...')

    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kccxmxxkwppeavcjvewd.supabase.co'
    const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    try {
      const { data: { user } } = await supabase.auth.getUser()

      let finalDistrictId = isCustomDistrict ? null : formData.district_id
      let finalTownName = isCustomTown ? formData.custom_town : formData.town_name

      if (isCustomDistrict && formData.custom_district.trim()) {
        const { data: newNode } = await supabase
          .from('geographic_nodes')
          .insert([{ name: formData.custom_district.trim(), level: 'DISTRICT_CITY' }])
          .select('id')
          .single()

        if (newNode) {
          finalDistrictId = newNode.id
        }
      }

      const uploadedImageUrls: string[] = []

      for (let i = 0; i < selectedFiles.length; i++) {
        setUploadStatus(`Uploading photo ${i + 1} of ${selectedFiles.length}...`)
        const compressedBlob = await compressImage(selectedFiles[i])
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.webp`

        const uploadRes = await fetch(`${baseUrl}/storage/v1/object/properties/${fileName}`, {
          method: 'POST',
          headers: {
            'apikey': apiKey,
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'image/webp',
            'x-upsert': 'true'
          },
          body: compressedBlob
        })

        if (uploadRes.ok) {
          const publicUrl = `${baseUrl}/storage/v1/object/public/properties/${fileName}`
          uploadedImageUrls.push(publicUrl)
        }
      }

      setUploadStatus('Saving listing details...')

      const finalImages = uploadedImageUrls.length > 0
        ? uploadedImageUrls
        : ['https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80']

      const payload = {
        title: formData.title,
        district_id: finalDistrictId,
        town_name: finalTownName,
        village_name: formData.village_name,
        rent_amount: Number(formData.rent_amount),
        currency: formData.currency,
        description: formData.description,
        landlord_id: user?.id || null,
        status: 'AVAILABLE',
        images: finalImages
      }

      const res = await fetch(`${baseUrl}/rest/v1/properties`, {
        method: 'POST',
        headers: {
          'apikey': apiKey,
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        throw new Error(`Failed to publish listing (${res.status})`)
      }

      router.push('/')
      router.refresh()
    } catch (err: any) {
      setError(err?.message || 'Submission failed. Please check input data.')
    } finally {
      setLoading(false)
      setUploadStatus('')
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="max-w-2xl mx-auto mb-6">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition">
          ← Back to home
        </Link>
      </div>

      <div className="max-w-2xl mx-auto bg-white rounded-2xl p-6 md:p-10 border border-slate-200 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">List a New Property</h1>
        <p className="text-sm text-slate-500 mb-8">Publish rental unit details with phone camera or gallery upload.</p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Property Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Modern 2 Bedroom Apartment"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">District / City *</label>
              {!isCustomDistrict ? (
                <select
                  required
                  value={formData.district_id}
                  onChange={(e) => {
                    if (e.target.value === 'OTHER') {
                      setIsCustomDistrict(true)
                      setFormData({ ...formData, district_id: '' })
                    } else {
                      setFormData({ ...formData, district_id: e.target.value })
                    }
                  }}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                >
                  <option value="">-- Select District / City --</option>
                  {loadingDistricts ? (
                    <option value="" disabled>Loading districts...</option>
                  ) : (
                    districts.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))
                  )}
                  <option value="OTHER">+ Add Other District / City</option>
                </select>
              ) : (
                <div className="space-y-1">
                  <input
                    type="text"
                    required
                    placeholder="Enter District Name"
                    value={formData.custom_district}
                    onChange={(e) => setFormData({ ...formData, custom_district: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-emerald-500 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-emerald-50/20"
                  />
                  <button
                    type="button"
                    onClick={() => setIsCustomDistrict(false)}
                    className="text-[11px] font-bold text-emerald-700 hover:underline"
                  >
                    ← Select from list
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Town / Region *</label>
              {!isCustomTown ? (
                <select
                  value={formData.town_name}
                  onChange={(e) => {
                    if (e.target.value === 'OTHER') {
                      setIsCustomTown(true)
                      setFormData({ ...formData, town_name: '' })
                    } else {
                      setFormData({ ...formData, town_name: e.target.value })
                    }
                  }}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                >
                  <option value="Sonde">Sonde</option>
                  <option value="Kyaliwajala">Kyaliwajala</option>
                  <option value="Kira">Kira</option>
                  <option value="Kisasi">Kisasi</option>
                  <option value="Naalya">Naalya</option>
                  <option value="OTHER">+ Add Other Town / Region</option>
                </select>
              ) : (
                <div className="space-y-1">
                  <input
                    type="text"
                    required
                    placeholder="Enter Town / Region"
                    value={formData.custom_town}
                    onChange={(e) => setFormData({ ...formData, custom_town: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-emerald-500 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-emerald-50/20"
                  />
                  <button
                    type="button"
                    onClick={() => setIsCustomTown(false)}
                    className="text-[11px] font-bold text-emerald-700 hover:underline"
                  >
                    ← Select from list
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Village / Zone</label>
              <input
                type="text"
                placeholder="e.g. Luwero Zone"
                value={formData.village_name}
                onChange={(e) => setFormData({ ...formData, village_name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Monthly Rent *</label>
              <input
                type="number"
                required
                placeholder="e.g. 800000"
                value={formData.rent_amount}
                onChange={(e) => setFormData({ ...formData, rent_amount: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Currency</label>
              <input
                type="text"
                disabled
                value={formData.currency}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 text-sm font-semibold"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                Property Photos
              </label>
              <span className="text-xs font-bold text-slate-400">
                {selectedFiles.length} photo{selectedFiles.length === 1 ? '' : 's'} added
              </span>
            </div>

            {/* Hidden Input Handles */}
            <input
              type="file"
              ref={cameraInputRef}
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />
            <input
              type="file"
              ref={fileInputRef}
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Explicit Dual Upload Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm"
              >
                📷 Take Photo with Camera
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition border border-slate-200"
              >
                📁 Upload from Gallery
              </button>
            </div>

            {previews.length > 0 && (
              <div className="grid grid-cols-4 gap-3 mt-4">
                {previews.map((src, index) => (
                  <div key={index} className="relative h-20 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 group">
                    <img src={src} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-1 right-1 bg-slate-900/80 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold hover:bg-red-600 transition"
                      title="Remove photo"
                    >
                      ✕
                    </button>
                    {index === 0 && (
                      <span className="absolute bottom-1 left-1 bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                        Cover
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Property Description</label>
            <textarea
              rows={4}
              placeholder="Provide amenities, security features, water billing terms, and access notes..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-slate-800 transition shadow-sm disabled:opacity-50"
          >
            {loading ? uploadStatus || 'Publishing Listing...' : 'Publish Property'}
          </button>
        </form>
      </div>
    </main>
  )
}
