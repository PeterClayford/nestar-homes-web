'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

interface Message {
  sender: 'user' | 'abigail'
  text: string
}

export default function AbigailWidget({ propertyId }: { propertyId?: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'abigail',
      text: "Hello! I'm Abigail, Nestar Homes AI Receptionist. Looking to inspect this property or ask about pricing?",
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string>('')
  const [isLinking, setIsLinking] = useState(false)

  const chatEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    async function initSession() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setSessionId(user.id)
      } else {
        let anonId = localStorage.getItem('nestar_anon_session')
        if (!anonId) {
          anonId = 'anon_' + Math.random().toString(36).substring(2, 9)
          localStorage.setItem('nestar_anon_session', anonId)
        }
        setSessionId(anonId)
      }
    }
    initSession()
  }, [supabase])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleWhatsAppRedirect = async () => {
    setIsLinking(true)
    try {
      const res = await fetch('/api/abigail/whatsapp-link')
      if (res.ok) {
        const data = await res.json()
        if (data.url) {
          window.open(data.url, '_blank')
          setIsLinking(false)
          return
        }
      }
    } catch {
      // Fall back to standard link if unauthenticated or on error
    }
    const defaultPhone = process.env.NEXT_PUBLIC_WHATSAPP_PHONE_NUMBER || '256700000000'
    window.open(`https://wa.me/${defaultPhone}?text=Hi%20Abigail,%20I'm%20inquiring%20about%20Nestar%20Homes`, '_blank')
    setIsLinking(false)
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userText = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { sender: 'user', text: userText }])
    setLoading(true)

    try {
      const res = await fetch('/api/abigail/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: userText,
          propertyId,
          channel: 'web',
        }),
      })

      const data = await res.json()
      setMessages((prev) => [
        ...prev,
        { sender: 'abigail', text: data.reply || "I'm processing your request!" },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        { sender: 'abigail', text: "Sorry, I had a quick glitch. Please try again or reach me on WhatsApp!" },
      ])
    }
    setLoading(false)
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-3 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 rounded-full shadow-2xl transition-all transform hover:scale-105 cursor-pointer border border-emerald-600/40"
        >
          <div className="relative w-7 h-7 rounded-full overflow-hidden border border-white/40 shrink-0" suppressHydrationWarning>
            <Image
              src="/abigail-avatar.jpg"
              alt="Abigail AI"
              fill
              sizes="28px"
              className="object-cover"
            />
          </div>
          <span className="text-xs font-black tracking-wide">Ask Abigail AI</span>
        </button>
      )}

      {isOpen && (
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-80 sm:w-96 h-[480px] flex flex-col overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-9 h-9 rounded-full overflow-hidden border border-emerald-400/40 shrink-0 bg-emerald-950" suppressHydrationWarning>
                <Image
                  src="/abigail-avatar.jpg"
                  alt="Abigail AI"
                  fill
                  sizes="36px"
                  className="object-cover"
                />
              </div>
              <div>
                <h3 className="text-xs font-black tracking-tight">Abigail Receptionist</h3>
                <p className="text-[10px] text-emerald-200">Online • Nestar Homes AI</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-emerald-200 hover:text-white font-bold text-sm cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50/50 text-xs">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-2xl leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-emerald-600 text-white rounded-br-none font-medium'
                      : 'bg-white text-gray-800 border border-gray-100 shadow-xs rounded-bl-none font-medium'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-400 p-3 rounded-2xl border border-gray-100 text-[11px] font-bold animate-pulse">
                  Abigail is typing...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="p-3 bg-white border-t border-gray-100 space-y-2">
            <button
              type="button"
              onClick={handleWhatsAppRedirect}
              disabled={isLinking}
              className="w-full text-center text-[10px] font-black text-emerald-700 bg-emerald-50 hover:bg-emerald-100 py-1.5 rounded-xl transition cursor-pointer"
            >
              {isLinking ? "Generating Secure Link..." : "💬 Prefer Voice Notes? Chat on WhatsApp →"}
            </button>

            <form onSubmit={handleSend} className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about price, location, tours..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-gray-50/50"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shrink-0"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
