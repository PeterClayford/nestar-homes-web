'use client'

import { useState, useEffect } from 'react'
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

  const [loading, setLoading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  const [districts, setDistricts] = useState<GeographicNode[]>([])
  const [loadingDistricts, setLoadingDistricts] = useState(true)

  const [formData, setFormData] = useState({
    title: '',
    district_id: '',
    town_name: 'Sonde',
    village_name: '',
    rent_amount: '',
    currency: 'UGX',
    description: '',
  })

  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])

  // Fetch Ugandan Districts/Cities from geographic_nodes
  useEffect(() => {
    async function fetchDistricts() {
      try {
        const { data, error } = await supabase
          .from('geographic_nodes')
          .select('id, name')
          .order('name', { ascending: true })

        if (!error && data && data.length > 0) {
          setDistricts(data as GeographicNode[])
          setFormData((prev) => ({ ...prev, district_id: data[0].id }))
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
    setLoading(true)
    setError(null)
    setUploadStatus('Compressing images...')

    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kccxmxxkwppeavcjvewd.supabase.co'
    const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    try {
      // 1. Capture logged in user for landlord ownership binding
      const { data: { user } } = await supabase.auth.getUser()

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
        district_id: formData.district_id || null,
        town_name: formData.town_name,
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
        <p className="text-sm text-slate-500 mb-8">Publish rental unit details with compressed multi-photo gallery.</p>

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

          {/* Location Fields: District/City, Town/Region, Village/Zone */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">District / City *</label>
              <select
                required
                value={formData.district_id}
                onChange={(e) => setFormData({ ...formData, district_id: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
              >
                {loadingDistricts ? (
                  <option value="">Loading districts...</option>
                ) : districts.length === 0 ? (
                  <>
                    <option value="">Kampala</option>
                    <option value="">Wakiso</option>
                    <option value="">Mukono</option>
                  </>
                ) : (
                  districts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Town / Region *</label>
              <select
                value={formData.town_name}
                onChange={(e) => setFormData({ ...formData, town_name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
              >
                <option value="Sonde">Sonde</option>
                <option value="Kyaliwajala">Kyaliwajala</option>
                <option value="Kira">Kira</option>
                <option value="Kisasi">Kisasi</option>
                <option value="Naalya">Naalya</option>
              </select>
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

            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
            />

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
