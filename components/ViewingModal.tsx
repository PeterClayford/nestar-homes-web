'use client'

import { useState, useEffect } from 'react'

interface ViewingModalProps {
  propertyId?: string
  propertyTitle: string
  propertyPrice: number
  currency: string
  isOpen: boolean
  onClose: () => void
}

export default function ViewingModal({ propertyId, propertyTitle, propertyPrice, currency, isOpen, onClose }: ViewingModalProps) {
  const [phone, setPhone] = useState('')
  const [network, setNetwork] = useState<'MTN' | 'AIRTEL'>('MTN')
  const [step, setStep] = useState<'FORM' | 'PENDING' | 'SUCCESS'>('FORM')
  const [warning, setWarning] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const cleanPhone = phone.replace(/\s+/g, '')

    let prefix = ''
    if (cleanPhone.startsWith('+256')) prefix = cleanPhone.substring(4, 7)
    else if (cleanPhone.startsWith('256')) prefix = cleanPhone.substring(3, 6)
    else if (cleanPhone.startsWith('0')) prefix = cleanPhone.substring(1, 4)

    if (prefix.length >= 2) {
      const mtnPrefixes = ['77', '78', '76', '79', '39']
      const airtelPrefixes = ['75', '70', '74']

      const matchMTN = mtnPrefixes.some(p => prefix.startsWith(p))
      const matchAirtel = airtelPrefixes.some(p => prefix.startsWith(p))

      if (matchMTN && network !== 'MTN') {
        setNetwork('MTN')
        setWarning('Switched to MTN MoMo based on your phone number.')
      } else if (matchAirtel && network !== 'AIRTEL') {
        setNetwork('AIRTEL')
        setWarning('Switched to Airtel Money based on your phone number.')
      } else if (matchMTN || matchAirtel) {
        setWarning(null)
      }
    } else {
      setWarning(null)
    }
  }, [phone, network])

  if (!isOpen) return null

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kccxmxxkwppeavcjvewd.supabase.co'
    const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    try {
      // 1. Log viewing intent in Supabase
      const payload = {
        property_id: propertyId || null,
        property_title: propertyTitle,
        phone_number: phone,
        network: network,
        amount: 10000,
        currency: 'UGX',
        status: 'PENDING'
      }

      await fetch(`${baseUrl}/rest/v1/viewings`, {
        method: 'POST',
        headers: {
          'apikey': apiKey,
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(payload)
      })

      // 2. Trigger real USSD Prompt via Next.js API Route
      const gatewayRes = await fetch('/api/payments/momo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone,
          network: network,
          propertyTitle: propertyTitle,
          propertyId: propertyId
        })
      })

      const resData = await gatewayRes.json()

      if (!gatewayRes.ok) {
        throw new Error(resData?.error || 'Failed to dispatch MoMo push prompt.')
      }

      setStep('PENDING')
      
      // Auto move to success screen after push sequence completes
      setTimeout(() => {
        setStep('SUCCESS')
      }, 5000)

    } catch (err: any) {
      console.error('Payment Error:', err)
      setError(err?.message || 'Could not initiate USSD prompt. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const resetAndClose = () => {
    setStep('FORM')
    setPhone('')
    setWarning(null)
    setError(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-2xl p-6 md:p-8 shadow-xl relative border border-slate-100">
        <button
          onClick={resetAndClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-sm font-bold w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center transition"
        >
          ✕
        </button>

        {step === 'FORM' && (
          <form onSubmit={handlePayment} className="space-y-5">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                Instant Priority Access
              </span>
              <h3 className="text-xl font-bold text-slate-900 mt-2">Schedule Viewing</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                A verification commitment fee of <span className="font-bold text-slate-800">10,000 UGX</span> reserves an exclusive in-person inspection slot for <span className="font-semibold text-slate-700">{propertyTitle}</span>.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Select Mobile Money Network
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setNetwork('MTN')}
                  className={`py-3 px-4 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                    network === 'MTN'
                      ? 'border-yellow-500 bg-yellow-50 text-slate-900 ring-2 ring-yellow-400/50'
                      : 'border-slate-200 bg-slate-50 text-slate-500'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                  MTN MoMo
                </button>
                <button
                  type="button"
                  onClick={() => setNetwork('AIRTEL')}
                  className={`py-3 px-4 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                    network === 'AIRTEL'
                      ? 'border-red-500 bg-red-50 text-slate-900 ring-2 ring-red-400/50'
                      : 'border-slate-200 bg-slate-50 text-slate-500'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  Airtel Money
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                required
                placeholder="e.g. 0790000000 / 0770000000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
              {warning && (
                <p className="text-[11px] font-medium text-amber-600 mt-1.5 flex items-center gap-1">
                  <span>ℹ</span> {warning}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-bold text-sm hover:bg-emerald-700 transition shadow-sm disabled:opacity-50"
            >
              {loading ? 'Initiating USSD Prompt...' : `Pay 10,000 UGX via ${network}`}
            </button>
          </form>
        )}

        {step === 'PENDING' && (
          <div className="py-8 text-center space-y-4">
            <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <h4 className="text-lg font-bold text-slate-900">USSD Push Sent</h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
              Check phone <span className="font-bold text-slate-800">{phone}</span> ({network}) and enter your PIN to authorize 10,000 UGX.
            </p>
          </div>
        )}

        {step === 'SUCCESS' && (
          <div className="py-6 text-center space-y-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
              ✓
            </div>
            <h4 className="text-xl font-bold text-slate-900">Viewing Reserved!</h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
              Your payment prompt has been initiated. A Nestar field agent will contact <span className="font-bold text-slate-800">{phone}</span> shortly.
            </p>
            <button
              onClick={resetAndClose}
              className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-sm hover:bg-slate-800 transition"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
