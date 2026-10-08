import { SupabaseClient } from '@supabase/supabase-js'

export interface PropertyOwner {
  full_name?: string
  phone_number?: string
  whatsapp_number?: string
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
        phone_number,
        whatsapp_number,
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
    
    // Extract only the First Name for public privacy
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
            full_name: firstNameOnly, // Privacy Mask: First Name Only
            phone_number: ownerData.phone_number || '',
            whatsapp_number: ownerData.whatsapp_number || ownerData.phone_number || '',
            is_verified: ownerData.is_verified || false,
          }
        : undefined,
    }
  })
}
