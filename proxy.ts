import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const url = request.nextUrl.clone()

  if (url.pathname.startsWith('/properties/')) {
    if (!user) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', url.pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  if (url.pathname.startsWith('/submit') || url.pathname.startsWith('/admin')) {
    if (!user) {
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, status')
      .eq('id', user.id)
      .single()

    if (url.pathname.startsWith('/submit')) {
      const allowedRoles = ['landlord', 'property_manager', 'broker', 'admin']
      if (!profile || !allowedRoles.includes(profile.role) || profile.status !== 'active') {
        url.pathname = '/'
        return NextResponse.redirect(url)
      }
    }

    if (url.pathname.startsWith('/admin')) {
      if (!profile || !['admin', 'tech_auditor'].includes(profile.role)) {
        url.pathname = '/'
        return NextResponse.redirect(url)
      }
    }
  }

  return response
}

export default proxy

export const config = {
  matcher: ['/properties/:path*', '/submit/:path*', '/admin/:path*'],
}
