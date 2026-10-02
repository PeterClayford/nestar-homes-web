import { SupabaseClient } from '@supabase/supabase-js'

export interface Property {
  id: string
  title: string
  description?: string
  district?: string     // Mapped from DB: geographic_nodes join or district_name fallback
  location: string      // Mapped from DB: town_name
  zone: string          // Mapped from DB: village_name
  price: number         // Mapped from DB: rent_amount
  currency: string      // Mapped from DB: currency
  images: string[]      // Mapped from DB: images array
  coverImage: string    // Mapped from DB: images[0] or default fallback
  status: string        // Mapped from DB: status
  createdAt: string
}

export async function getPublishedProperties(supabase: SupabaseClient): Promise<Property[]> {
  const { data, error } = await supabase
    .from('properties')
    .select(`
      *,
      district_node:geographic_nodes!district_id(name)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching properties with relational join, retrying base select:', error)
    const { data: fallbackData } = await supabase
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false })

    if (!fallbackData) return []
    return mapProperties(fallbackData)
  }

  if (!data) return []
  return mapProperties(data)
}

function mapProperties(data: any[]): Property[] {
  return data.map((row: any) => ({
    id: row.id,
    title: row.title || 'Untitled Property',
    description: row.description || '',
    district: row.district_node?.name || row.district_name || '',
    location: row.town_name || 'Kampala',
    zone: row.village_name || 'Central',
    price: Number(row.rent_amount) || 0,
    currency: row.currency || 'UGX',
    images: Array.isArray(row.images) && row.images.length > 0 ? row.images : [],
    coverImage:
      Array.isArray(row.images) && row.images.length > 0
        ? row.images[0]
        : 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
    status: row.status || 'AVAILABLE',
    createdAt: row.created_at,
  }))
}