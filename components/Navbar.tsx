'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

interface UserProfile {
  id: string
  email: string
  role: 'client' | 'landlord' | 'property_manager' | 'broker' | 'admin' | 'tech_auditor'
  status: string
}

export default function Navbar() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadSession() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('id, email, role, status')
          .eq('id', user.id)
          .single()
        
        if (data) setProfile(data as UserProfile)
      }
      setLoading(false)
    }

    loadSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadSession()
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo.svg"
            alt="Nestar Homes"
            width={150}
            height={40}
            className="h-9 w-auto object-contain"
            priority
            onError={(e) => {
              // Fallback to text if logo.svg missing
              e.currentTarget.style.display = 'none'
            }}
          />
          <span className="font-black text-lg tracking-tight text-emerald-600">
            NESTAR <span className="text-gray-900 font-medium">HOMES</span>
          </span>
        </Link>

        {/* Dynamic Navigation Links */}
        <nav className="flex items-center gap-5 text-xs font-semibold text-gray-600">
          <Link href="/" className="hover:text-emerald-600 transition">
            Explore
          </Link>

          {!loading && profile && (
            <>
              {/* Creator & Admin Actions */}
              {['landlord', 'property_manager', 'broker', 'admin'].includes(profile.role) && (
                <>
                  <Link href="/submit" className="hover:text-emerald-600 transition">
                    Post Property
                  </Link>
                  <Link href="/leads" className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition">
                    Leads Dashboard
                  </Link>
                </>
              )}

              {/* Admin & Tech Auditor Controls */}
              {['admin', 'tech_auditor'].includes(profile.role) && (
                <>
                  <Link href="/admin/users" className="hover:text-emerald-600 transition">
                    Users Panel
                  </Link>
                  <Link href="/admin/viewings" className="hover:text-emerald-600 transition">
                    Viewings
                  </Link>
                  <Link href="/admin/audit-logs" className="hover:text-emerald-600 transition">
                    Audit Logs
                  </Link>
                </>
              )}

              {/* Client Upgrade Link */}
              {profile.role === 'client' && (
                <Link href="/account/upgrade" className="text-emerald-600 hover:text-emerald-700 font-bold transition">
                  Become a Partner
                </Link>
              )}
            </>
          )}

          {/* Authentication State */}
          {!loading && (
            profile ? (
              <button
                onClick={handleSignOut}
                className="text-gray-400 hover:text-red-600 transition cursor-pointer"
              >
                Sign Out
              </button>
            ) : (
              <Link
                href="/login"
                className="bg-gray-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-gray-800 transition shadow-sm"
              >
                Sign In
              </Link>
            )
          )}
        </nav>

      </div>
    </header>
  )
}
