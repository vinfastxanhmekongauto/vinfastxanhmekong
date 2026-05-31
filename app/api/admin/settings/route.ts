import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { verifyToken } from '@/lib/auth-utils';
import { cookies } from 'next/headers';

export async function GET() {
    try {
        const supabase = await createClient();

        // Ensure user is authenticated using getUser() or custom session token
        const { data: { user } } = await supabase.auth.getUser();
        const cookieStore = await cookies();
        const token = cookieStore.get('admin_session')?.value;
        const valid = await verifyToken(token);

        if (!user && !valid) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data, error } = await supabase
            .from('site_settings')
            .select('*')
            .eq('id', 1)
            .maybeSingle();

        if (error) {
            console.error('Error fetching settings:', error);
            return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
        }

        return NextResponse.json({ data: data || {} });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const supabase = await createClient();

        // Ensure user is authenticated using getUser() or custom session token
        const { data: { user } } = await supabase.auth.getUser();
        const cookieStore = await cookies();
        const token = cookieStore.get('admin_session')?.value;
        const valid = await verifyToken(token);

        if (!user && !valid) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { id, ...dataToUpdate } = body;

        // Ensure we always have an id to update, fallback to 1 if not provided by client
        const updateId = id || 1;

        // Update the data
        const { data, error } = await supabase
            .from('site_settings')
            .update({ 
                ...dataToUpdate,
                updated_at: new Date().toISOString()
            })
            .eq('id', updateId)
            .select()
            .single();

        if (error) {
            console.error('Error updating settings:', error);
            return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
        }

        return NextResponse.json({ data });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
