import Navbar from '@/components/Navbar'
import AbigailWidget from '@/components/AbigailWidget'
import { createClient } from '@/lib/supabase/client'

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  return (
    <div className="min-h-screen bg-gray-50 font-sans relative">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <h1 className="text-2xl font-black text-gray-900">Property Inspection</h1>
          <p className="text-xs text-gray-500 mt-1">Property ID: {id}</p>
        </div>
      </main>

      {/* Embedded Abigail Widget with active Property Context */}
      <AbigailWidget propertyId={id} />
    </div>
  )
}
