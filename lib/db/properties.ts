import { SupabaseClient } from '@supabase/supabase-js'

export interface PropertyOwner {
  first_name?: string
  is_verified?: boolean
}

export interface Property {
  id: string
  title: string
  description?: string
  district?: string
  location: string
  zone: string
  price: number
  currency: string
  images: string[]
  coverImage: string
  status: string
  createdAt: string
  owner?: PropertyOwner
}

export async function getPublishedProperties(supabase: SupabaseClient): Promise<Property[]> {
  const { data, error } = await supabase
    .from('properties')
    .select(`
      *,
      geographic_nodes!district_id(id, name, node_type),
      owner:profiles!landlord_id(
        full_name,
        is_verified
      )
    `)
    .in('status', ['AVAILABLE', 'Active', 'PENDING', 'Pending', 'RENTED', 'Rented'])
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching properties from Supabase:', error)
    return []
  }

  if (!data) return []

  return data.map((row: any) => {
    const ownerData = Array.isArray(row.owner) ? row.owner[0] : row.owner
    
    // Privacy Shield: Extract only First Name
    const rawName = ownerData?.full_name?.trim() || ''
    const firstNameOnly = rawName ? rawName.split(' ')[0] : ''

    return {
      id: row.id,
      title: row.title || 'Untitled Property',
      description: row.description || '',
      district: row.geographic_nodes?.name || row.district_name || '',
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
      owner: ownerData
        ? {
            first_name: firstNameOnly,
            is_verified: ownerData.is_verified || false,
          }
        : undefined,
    }
  })
}
