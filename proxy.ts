import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const url = request.nextUrl.clone()

  if (url.pathname.startsWith('/submit') || url.pathname.startsWith('/admin')) {
    if (!user) {
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, status, is_verified')
      .eq('id', user.id)
      .single()

    // Property Upload Guard (/submit)
    if (url.pathname.startsWith('/submit')) {
      const allowedRoles = ['landlord', 'property_manager', 'broker', 'admin']
      
      if (
        !profile || 
        !allowedRoles.includes(profile.role) || 
        profile.status !== 'active'
      ) {
        url.pathname = '/'
        return NextResponse.redirect(url)
      }
    }

    // Admin & Technical Auditor Guard (/admin)
    if (url.pathname.startsWith('/admin')) {
      if (!profile || !['admin', 'tech_auditor'].includes(profile.role)) {
        url.pathname = '/'
        return NextResponse.redirect(url)
      }
    }
  }

  return response
}

export const config = {
  matcher: ['/submit/:path*', '/admin/:path*'],
}
