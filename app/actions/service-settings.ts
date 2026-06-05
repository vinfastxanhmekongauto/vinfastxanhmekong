'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth-utils';

export async function updateServiceSettings(
    type: 'booking' | 'care' | 'gifts',
    settings: { banner_url?: string; og_image_url?: string; content_markdown?: string; gifts_data?: any[]; is_active?: boolean }
) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('admin_session')?.value;
        const valid = await verifyToken(token);

        if (!valid) {
            return { success: false, error: 'Unauthorized' };
        }

        const updatePayload: any = {
            updated_at: new Date().toISOString()
        };

        if (settings.banner_url !== undefined) updatePayload.banner_url = settings.banner_url;
        if (settings.og_image_url !== undefined) updatePayload.og_image_url = settings.og_image_url;
        if (settings.content_markdown !== undefined) updatePayload.content_markdown = settings.content_markdown;
        if (settings.gifts_data !== undefined) updatePayload.gifts_data = settings.gifts_data;
        if (settings.is_active !== undefined) updatePayload.is_active = settings.is_active;

        const { error } = await supabaseAdmin
            .from('service_settings')
            .update(updatePayload)
            .eq('service_type', type);

        if (error) {
            console.error('Error updating service settings:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (err: any) {
        console.error('Failed to update service settings:', err);
        return { success: false, error: err?.message || 'Server error' };
    }
}
