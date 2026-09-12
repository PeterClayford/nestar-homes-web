import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { phone, network, propertyTitle } = body

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
    }

    // Standardize phone format to Uganda international format (256...)
    let formattedPhone = phone.replace(/\s+/g, '')
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '256' + formattedPhone.substring(1)
    } else if (formattedPhone.startsWith('+')) {
      formattedPhone = formattedPhone.substring(1)
    }

    const mode = process.env.NEXT_PUBLIC_PAYMENT_MODE || 'mock'

    // ==========================================
    // 1. MOCK MODE (For Sandbox & Local Testing)
    // ==========================================
    if (mode === 'mock') {
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const mockXml = `<?xml version="1.0" encoding="UTF-8"?>
<AutoCreate>
  <Response>
    <Status>OK</Status>
    <StatusCode>0</StatusCode>
    <TransactionReference>MOCK-NEST-${Date.now()}</TransactionReference>
    <MNOTransactionReferenceId>${network || 'MOMO'}-USSD-SUCCESS</MNOTransactionReferenceId>
  </Response>
</AutoCreate>`

      return NextResponse.json({
        success: true,
        message: `Simulated USSD Push sent to ${formattedPhone}`,
        rawResponse: mockXml
      })
    }

    // ==========================================
    // 2. LIVE PRODUCTION MODE (Yo! Payments API)
    // ==========================================
    const yoUser = process.env.YO_API_USERNAME || '90008733994'
    const yoPass = process.env.YO_API_PASSWORD || '2211120857'

    const xmlPayload = `<?xml version="1.0" encoding="UTF-8"?>
<AutoCreate>
  <Request>
    <APIUsername>${yoUser}</APIUsername>
    <APIPassword>${yoPass}</APIPassword>
    <Method>acdepositmobilemoney</Method>
    <NonBlocking>FALSE</NonBlocking>
    <Amount>10000</Amount>
    <Account>${formattedPhone}</Account>
    <Narrative>Nestar Viewing: ${propertyTitle || 'Property Viewing'}</Narrative>
  </Request>
</AutoCreate>`

    const yoResponse = await fetch('https://paymentsweb.yo.co.ug/ybs/xml_serve.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml',
        'Content-Length': Buffer.byteLength(xmlPayload).toString()
      },
      body: xmlPayload
    })

    const responseText = await yoResponse.text()

    if (yoResponse.ok && (responseText.includes('OK') || responseText.includes('PENDING'))) {
      return NextResponse.json({
        success: true,
        message: 'USSD PIN prompt dispatched to phone.',
        rawResponse: responseText
      })
    } else {
      return NextResponse.json({
        error: 'Payment gateway rejected prompt. Verify phone balance or business API permissions.',
        rawResponse: responseText
      }, { status: 400 })
    }
  } catch (err: any) {
    console.error('Payment Route Error:', err)
    return NextResponse.json({ error: err?.message || 'Gateway connection failed' }, { status: 500 })
  }
}
