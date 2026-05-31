import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET() {
    try {
        // Using createClient allows us to use the same logic, but we don't require authentication here
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('site_settings')
            .select('*')
            .eq('id', 1)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Error fetching public settings:', error);
            return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
        }

        return NextResponse.json({ data: data || {} });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
