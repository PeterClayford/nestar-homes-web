'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function Navbar() {
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    checkUser()

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Nestar Homes Official Brand Logo */}
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo.svg"
            alt="Nestar Homes"
            width={150}
            height={40}
            className="h-9 w-auto object-contain"
            priority
          />
        </Link>

        {/* Global Navigation */}
        <nav className="flex items-center space-x-2 sm:space-x-4">
          <Link
            href="/"
            className="text-sm font-semibold text-gray-600 hover:text-emerald-600 px-3 py-2 rounded-lg transition"
          >
            Explore
          </Link>
          <Link
            href="/submit"
            className="text-sm font-semibold text-gray-600 hover:text-emerald-600 px-3 py-2 rounded-lg transition"
          >
            Post Property
          </Link>

          {user ? (
            <div className="flex items-center space-x-2">
              <Link
                href="/admin/viewings"
                className="text-sm font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-3 py-2 rounded-lg transition"
              >
                Leads Dashboard
              </Link>
              <button
                onClick={handleSignOut}
                className="text-sm font-semibold text-gray-500 hover:text-gray-800 px-2 py-2"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="text-sm font-semibold bg-gray-900 text-white hover:bg-gray-800 px-4 py-2 rounded-lg transition shadow-sm"
            >
              Agent Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
