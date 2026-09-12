'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [checkingEmail, setCheckingEmail] = useState(false)
  const [showResendOptions, setShowResendOptions] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)

  const emailInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTarget = searchParams.get('redirect') || '/'
  const supabase = createClient()

  // Auto-redirect if user is already authenticated
  useEffect(() => {
    async function checkExistingSession() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        window.location.href = redirectTarget
      }
    }
    checkExistingSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user && event === 'SIGNED_IN') {
        window.location.href = redirectTarget
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase, redirectTarget])

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
        setShowResendOptions(false)
      }
    } catch (err) {
      console.error('Email check error:', err)
    } finally {
      setCheckingEmail(false)
    }
  }

  const handleResendVerification = async () => {
    if (!email || !email.includes('@')) {
      setMessage({ type: 'error', text: 'Please enter a valid email address first.' })
      return
    }

    setResending(true)
    setMessage(null)

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim().toLowerCase(),
      })

      if (error) throw error

      setMessage({
        type: 'success',
        text: 'A fresh confirmation link has been sent to your email. Please check your inbox.',
      })
      setShowResendOptions(false)
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to resend confirmation email.' })
    } finally {
      setResending(false)
    }
  }

  const handleEditEmail = () => {
    setShowResendOptions(false)
    setMessage(null)
    setIsSignUp(true)
    setTimeout(() => {
      emailInputRef.current?.focus()
      emailInputRef.current?.select()
    }, 50)
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    setShowResendOptions(false)

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
          window.location.href = redirectTarget
          return
        }

        setMessage({
          type: 'success',
          text: 'Account created! Please check your inbox to confirm your email.',
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

        window.location.href = redirectTarget
      }
    } catch (err: any) {
      const errMsg = err.message || ''
      
      if (errMsg.toLowerCase().includes('email not confirmed')) {
        setMessage({
          type: 'error',
          text: 'Your email address has not been confirmed yet.',
        })
        setShowResendOptions(true)
      } else if (errMsg.toLowerCase().includes('already registered') || errMsg.toLowerCase().includes('user_already_exists')) {
        setMessage({
          type: 'error',
          text: 'An account with this email already exists. Switched to Sign In.',
        })
        setIsSignUp(false)
        setPassword('')
      } else {
        setMessage({ type: 'error', text: errMsg || 'An error occurred during authentication.' })
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
              setShowResendOptions(false)
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
              className={`mb-6 p-4 rounded-xl text-xs font-semibold flex flex-col gap-2.5 ${
                message.type === 'error'
                  ? 'bg-red-50 text-red-700 border border-red-100'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
              }`}
            >
              <div>{message.text}</div>
              
              {showResendOptions && (
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={resending}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[11px] font-bold transition disabled:opacity-50 cursor-pointer"
                  >
                    {resending ? 'Sending...' : 'Resend Verification Link'}
                  </button>
                  <button
                    type="button"
                    onClick={handleEditEmail}
                    className="px-3 py-1.5 bg-white border border-red-200 text-red-700 hover:bg-red-100/50 rounded-lg text-[11px] font-bold transition cursor-pointer"
                  >
                    Edit Email Address
                  </button>
                </div>
              )}
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
                ref={emailInputRef}
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
