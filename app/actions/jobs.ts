'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth-utils';
import { revalidatePath } from 'next/cache';

export async function saveJob(formData: any, currentJobId?: string) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('admin_session')?.value;
        const valid = await verifyToken(token);

        if (!valid) {
            return { success: false, error: 'Unauthorized' };
        }

        // If this campaign is active, deactivate all other campaigns first
        if (formData.is_active) {
            const { error: deactivateError } = await supabaseAdmin
                .from('jobs')
                .update({ is_active: false })
                .neq('id', currentJobId || '00000000-0000-0000-0000-000000000000');

            if (deactivateError) {
                console.error('Failed to deactivate other jobs:', deactivateError);
                return { success: false, error: deactivateError.message };
            }
        }

        let result;
        if (currentJobId) {
            // Update existing job campaign
            result = await supabaseAdmin
                .from('jobs')
                .update(formData)
                .eq('id', currentJobId);
        } else {
            // Create a new job campaign
            result = await supabaseAdmin
                .from('jobs')
                .insert([formData]);
        }

        if (result.error) {
            console.error('Error saving job:', result.error);
            return { success: false, error: result.error.message, code: result.error.code };
        }

        return { success: true };
    } catch (err: any) {
        console.error('Failed to save job:', err);
        return { success: false, error: err?.message || 'Server error' };
    }
}

export async function toggleJobActiveStatus(id: string, newStatus: boolean) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('admin_session')?.value;
        const valid = await verifyToken(token);

        if (!valid) {
            return { success: false, error: 'Unauthorized' };
        }

        // If toggling active status to true, deactivate all other campaigns first
        if (newStatus) {
            const { error: deactivateError } = await supabaseAdmin
                .from('jobs')
                .update({ is_active: false })
                .neq('id', id);

            if (deactivateError) {
                console.error('Failed to deactivate other jobs:', deactivateError);
                return { success: false, error: deactivateError.message };
            }
        }

        const { error } = await supabaseAdmin
            .from('jobs')
            .update({ is_active: newStatus })
            .eq('id', id);

        if (error) {
            console.error('Error toggling job active status:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (err: any) {
        console.error('Failed to toggle job active status:', err);
        return { success: false, error: err?.message || 'Server error' };
    }
}

export async function duplicateJob(id: string) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('admin_session')?.value;
        const valid = await verifyToken(token);

        if (!valid) {
            return { success: false, error: 'Unauthorized' };
        }

        // Fetch the existing job record to clone
        const { data: job, error: fetchError } = await supabaseAdmin
            .from('jobs')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !job) {
            console.error('Failed to fetch job to duplicate:', fetchError);
            return { success: false, error: fetchError?.message || 'Job not found' };
        }

        // Clone and modify the payload to prevent conflicts
        const { id: _, created_at: __, ...clonedData } = job;
        clonedData.is_active = false; // Turn off to prevent automatic visibility conflict

        const { error: insertError } = await supabaseAdmin
            .from('jobs')
            .insert([clonedData]);

        if (insertError) {
            console.error('Error inserting duplicated job:', insertError);
            return { success: false, error: insertError.message };
        }

        revalidatePath('/admin/jobs');
        return { success: true };
    } catch (err: any) {
        console.error('Failed to duplicate job:', err);
        return { success: false, error: err?.message || 'Server error' };
    }
}
