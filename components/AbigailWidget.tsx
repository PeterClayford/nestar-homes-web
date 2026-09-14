'use client'

import { useState, useEffect, useRef } from 'react'
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
      text: "Hello! 👋 I'm Abigail, Nestar Homes AI Receptionist. Looking to inspect this property or ask about pricing?",
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string>('')

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
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3.5 rounded-full shadow-2xl transition-all transform hover:scale-105 cursor-pointer"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
          </span>
          <span className="text-xs font-black tracking-wide">Ask Abigail AI</span>
        </button>
      )}

      {/* Drawer Popover */}
      {isOpen && (
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-80 sm:w-96 h-[480px] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center font-black text-emerald-300 text-sm">
                🤖
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

          {/* Messages Window */}
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

          {/* WhatsApp Direct Option & Input Form */}
          <div className="p-3 bg-white border-t border-gray-100 space-y-2">
            <a
              href="https://wa.me/256700000000?text=Hi%20Abigail,%20I'm%20inquiring%20about%20Nestar%20Homes"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center text-[10px] font-black text-emerald-700 bg-emerald-50 hover:bg-emerald-100 py-1.5 rounded-xl transition"
            >
              💬 Prefer Voice Notes? Chat on WhatsApp →
            </a>

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
