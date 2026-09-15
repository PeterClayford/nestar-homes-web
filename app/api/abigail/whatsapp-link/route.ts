import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function GET(req: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create a 15-minute verification token bound to the logged-in user ID
    const payload = JSON.stringify({ userId: user.id, exp: Date.now() + 15 * 60 * 1000 })
    const token = Buffer.from(payload).toString('base64url')

    const whatsappPhone = process.env.NEXT_PUBLIC_WHATSAPP_PHONE_NUMBER || '256700000000'
    const prefilledText = encodeURIComponent(`Hi Abigail! Link my Nestar account: ${token}`)
    const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${prefilledText}`

    return NextResponse.json({ url: whatsappUrl, token })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
