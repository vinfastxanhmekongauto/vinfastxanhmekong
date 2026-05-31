import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { checkRateLimit } from '@/lib/rate-limit'
import bcrypt from 'bcryptjs'
import { signToken } from '@/lib/auth-utils'

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json()
        const username = email; // Map email payload to username concept
        // Identify user IP
        const ip = request.headers.get('x-forwarded-for') || '127.0.0.1'

        // Check IP rate limit first
        const rateLimitResult = await checkRateLimit(ip);
        if (!rateLimitResult.success) {
            return NextResponse.json({
                error: rateLimitResult.message,
                blocked: true
            }, { status: 429 });
        }

        const supabase = await createClient()

        // Fetch user from user_admin table instead of Supabase Auth
        const { data: adminRecord, error: fetchError } = await supabase
            .from('user_admin')
            .select('*')
            .eq('username', username)
            .limit(1)
            .single()

        if (fetchError || !adminRecord) {
            return NextResponse.json({ error: 'Tên truy cập hoặc mật khẩu không chính xác.' }, { status: 400 })
        }

        let isMatch = false;
        let needsPasswordChange = false;

        // Step A: Attempt to compare using bcrypt
        isMatch = await bcrypt.compare(password, adminRecord.password);

        // Step B (Fallback): If bcrypt fails, check direct plaintext match
        if (!isMatch) {
            isMatch = password === adminRecord.password;
            // If it matched plaintext, they should be prompted to hash it later
            if (isMatch) {
                needsPasswordChange = true;
            }
        }

        if (!isMatch) {
            return NextResponse.json({ error: 'Tên truy cập hoặc mật khẩu không chính xác.' }, { status: 400 })
        }

        // Generate Custom JWT Token
        const tokenStr = await signToken({
            username: adminRecord.username,
            role: 'admin'
        });

        // Setup response with Cookie
        const response = NextResponse.json({
            user: { username: adminRecord.username },
            needsPasswordChange
        }, { status: 200 })

        // Attach JWT token to HTTP-Only Cookie
        response.cookies.set({
            name: 'admin_session',
            value: tokenStr,
            httpOnly: true,
            path: '/',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24, // 1 day
            sameSite: 'lax',
        })

        return response
    } catch (error) {
        console.error('Login error:', error)
        return NextResponse.json({ error: 'Lỗi máy chủ. Vui lòng thử lại.' }, { status: 500 })
    }
}
