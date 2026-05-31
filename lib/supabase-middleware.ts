import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limit'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                    supabaseResponse = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    supabaseResponse.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                    supabaseResponse = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    supabaseResponse.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                },
            },
        }
    )

    // This will refresh session if expired for standard Supabase Auth users (e.g. customers if implemented in future)
    // We still keep auth.getUser() if we have other Supabase users, but for ADMIN we use our custom cookie.
    await supabase.auth.getUser()

    const pathname = request.nextUrl.pathname
    const isAuthRoute = pathname.startsWith('/admin/login')
    const isAdminRoute = pathname.startsWith('/admin')

    // HARD BLOCK via Middleware for /admin/login limit
    if (isAuthRoute) {
        const reqIp = (request as any).ip;
        const ip = reqIp || request.headers.get('x-forwarded-for') || '127.0.0.1'
        const rateLimitResult = await checkRateLimit(ip)

        if (!rateLimitResult.success) {
            // Return 429 response directly from Edge
            return new NextResponse(rateLimitResult.message, {
                status: 429,
                headers: { 'Content-Type': 'text/plain; charset=utf-8' }
            })
        }
    }

    // Check custom JWT admin session
    const adminSessionCookie = request.cookies.get('admin_session')?.value
    // In Edge middleware we ideally parse the JWT properly, but for simplicity a presence check combined
    // with proper backend JWT verification on API routes is sufficient. For robust edge middleware:
    // We would use jose jwtVerify here, but since auth-utils.ts is imported we could do that if it doesn't break edge runtime.
    // Assuming just having the cookie is a basic check; real verification happens in layout and APIs.

    if (isAdminRoute && !isAuthRoute && !adminSessionCookie) {
        // If accessing admin without session, redirect to login
        const loginUrl = new URL('/admin/login', request.url)
        return NextResponse.redirect(loginUrl)
    }

    if (isAuthRoute && adminSessionCookie) {
        // If accessing login with session, redirect to dashboard
        const dashboardUrl = new URL('/admin', request.url)
        return NextResponse.redirect(dashboardUrl)
    }

    return supabaseResponse
}
