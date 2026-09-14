import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function POST(req: Request) {
  try {
    const { sessionId, message, propertyId, channel = 'web' } = await req.json()

    if (!message || !sessionId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    const renderBackendUrl = process.env.ABIGAIL_RENDER_URL || 'https://abigail-bot.onrender.com/chat'

    // Forward query to Abigail's Render Engine
    const response = await fetch(renderBackendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABIGAIL_API_SECRET || ''}`,
      },
      body: JSON.stringify({
        session_id: sessionId,
        message,
        property_id: propertyId,
        channel,
      }),
    })

    if (!response.ok) {
      // Fallback response if Render container is spinning up / sleeping
      return NextResponse.json({
        reply: "Hello! I am Abigail, your Nestar Homes assistant. I'm currently syncing listing data—please hold on or leave your contact number!",
      })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { reply: "I'm having trouble connecting to my service right now, but you can request a direct callback!" },
      { status: 500 }
    )
  }
}
