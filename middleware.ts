import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from './lib/supabase-middleware'

export async function middleware(request: NextRequest) {
    const host = request.headers.get('host')
    if (host) {
        const hostLower = host.toLowerCase()
        if (
            hostLower === 'vinfastmekong.vn' ||
            hostLower === 'vinfastmekong.com.vn' ||
            hostLower === 'www.vinfastmekong.com.vn'
        ) {
            const redirectUrl = new URL(request.nextUrl.pathname + request.nextUrl.search, 'https://www.vinfastmekong.vn')
            return NextResponse.redirect(redirectUrl, 301)
        }
    }

    return await updateSession(request)
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - images/ (public images)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!api|_next/static|_next/image|images|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
