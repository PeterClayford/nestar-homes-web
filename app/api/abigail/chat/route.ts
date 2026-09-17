import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { sessionId, message, propertyId, channel = 'web' } = await req.json()

    if (!message || !sessionId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    const renderBackendUrl = process.env.ABIGAIL_RENDER_URL || 'https://abigail-bot.onrender.com/chat'

    console.log(`📡 [Web API] Forwarding query to: ${renderBackendUrl}`)

    const response = await fetch(renderBackendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_id: sessionId,
        message,
        property_id: propertyId,
        channel,
      }),
    })

    console.log(`📡 [Render Response Status]: ${response.status}`)

    if (!response.ok) {
      const errText = await response.text()
      console.error(`❌ [Render Rejected Request]: ${errText}`)
      return NextResponse.json({
        reply: `Backend unreachable (Status ${response.status}). Check terminal logs.`,
      })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error(`💥 [Fetch Exception]: ${error.message}`)
    return NextResponse.json(
      { reply: `Connection Exception: ${error.message}` },
      { status: 500 }
    )
  }
}
