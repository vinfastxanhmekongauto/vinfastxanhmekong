import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

// Service role key bypasses RLS — only use server-side, NEVER expose to client
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');

// Admin client: bypasses RLS, for server-only use (API routes)
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey || anonKey, {
    auth: { persistSession: false }
});

// Public client: respects RLS, safe for client-side use
export const supabase = createClient(supabaseUrl, anonKey);
