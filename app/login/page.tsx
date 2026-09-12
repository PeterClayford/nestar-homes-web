'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingEmail, setCheckingEmail] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)

  const router = useRouter()
  const supabase = createClient()

  // Real-time email check using RPC
  const checkEmailExists = async (emailToCheck: string) => {
    if (!isSignUp || !emailToCheck || !emailToCheck.includes('@')) return

    setCheckingEmail(true)
    try {
      const { data: exists, error } = await supabase.rpc('check_email_exists', {
        email_to_check: emailToCheck.trim().toLowerCase(),
      })

      if (!error && exists) {
        setMessage({
          type: 'error',
          text: 'This email is already registered. Switched to Sign In mode for you.',
        })
        setIsSignUp(false)
      }
    } catch (err) {
      console.error('Email check error:', err)
    } finally {
      setCheckingEmail(false)
    }
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        })

        if (error) throw error

        if (data?.user && data.user.identities && data.user.identities.length === 0) {
          setMessage({
            type: 'error',
            text: 'This email is already registered. Please Sign In.',
          })
          setIsSignUp(false)
          setPassword('')
          return
        }

        if (data?.session) {
          router.push('/')
          router.refresh()
          return
        }

        setMessage({
          type: 'success',
          text: 'Account created! Please switch to Sign In or check your email to confirm.',
        })
        
        setFullName('')
        setPassword('')
        setIsSignUp(false)

      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        })

        if (error) throw error

        router.push('/')
        router.refresh()
      }
    } catch (err: any) {
      if (err.message?.toLowerCase().includes('already registered') || err.message?.toLowerCase().includes('user_already_exists')) {
        setMessage({
          type: 'error',
          text: 'An account with this email already exists. Switched to Sign In.',
        })
        setIsSignUp(false)
        setPassword('')
      } else {
        setMessage({ type: 'error', text: err.message || 'An error occurred during authentication.' })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {isSignUp ? 'Create your Nestar Account' : 'Sign in to Nestar Homes'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {isSignUp ? 'Already have an account?' : "Don't have an account yet?"}{' '}
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp)
              setMessage(null)
            }}
            className="font-semibold text-emerald-600 hover:text-emerald-500 focus:outline-none underline"
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm sm:rounded-2xl border border-gray-100 sm:px-10">
          {message && (
            <div
              className={`mb-6 p-4 rounded-xl text-xs font-semibold ${
                message.type === 'error'
                  ? 'bg-red-50 text-red-700 border border-red-100'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
              }`}
            >
              {message.text}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleAuth}>
            {isSignUp && (
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Tirirayo Peter"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition outline-none"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => checkEmailExists(email)}
                placeholder="name@example.com"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => checkEmailExists(email)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading || checkingEmail}
              className="w-full flex justify-center py-3.5 px-4 rounded-xl shadow-sm text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition disabled:opacity-50 cursor-pointer"
            >
              {loading
                ? isSignUp
                  ? 'Creating Account...'
                  : 'Signing In...'
                : isSignUp
                ? 'Register Account'
                : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
