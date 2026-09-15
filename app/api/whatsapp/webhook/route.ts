import { NextResponse } from 'next/server'

// Meta WhatsApp Webhook Handshake (GET)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'nestar_whatsapp_webhook_token_2026'

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 })
  }

  return NextResponse.json({ error: 'Verification failed' }, { status: 403 })
}

// Inbound WhatsApp Text & Voice Payload Ingestion (POST)
export async function POST(req: Request) {
  try {
    const payload = await req.json()
    const renderBackendUrl = process.env.ABIGAIL_RENDER_URL || 'https://abigail-bot.onrender.com/whatsapp'

    // Relay incoming payload to Abigail's Python Engine on Render
    fetch(renderBackendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABIGAIL_API_SECRET || ''}`,
      },
      body: JSON.stringify(payload),
    }).catch((err) => console.error('Error forwarding to Abigail Render backend:', err))

    // Always acknowledge Meta within 3 seconds
    return NextResponse.json({ status: 'success' }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 })
  }
}
