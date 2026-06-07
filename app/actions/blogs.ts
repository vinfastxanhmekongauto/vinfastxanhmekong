'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth-utils';
import { revalidatePath } from 'next/cache';

export async function saveBlog(formData: any, currentBlogId?: string) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('admin_session')?.value;
        const valid = await verifyToken(token);

        if (!valid) {
            return { success: false, error: 'Unauthorized' };
        }

        // Clean payload values
        const payload = {
            title: formData.title,
            slug: formData.slug,
            content: formData.content,
            excerpt: formData.excerpt || null,
            category: formData.category || 'Tin tức VinFast',
            meta_title: formData.meta_title || null,
            meta_description: formData.meta_description || null,
            meta_keywords: formData.meta_keywords || null,
            is_published: formData.is_published !== false,
            thumbnail_url: formData.thumbnail_url || null,
            updated_at: new Date().toISOString(),
        };

        let result;
        if (currentBlogId) {
            // Update existing blog post
            result = await supabaseAdmin
                .from('blogs')
                .update(payload)
                .eq('id', currentBlogId);
        } else {
            // Create a new blog post
            result = await supabaseAdmin
                .from('blogs')
                .insert([payload]);
        }

        if (result.error) {
            console.error('Error saving blog:', result.error);
            return { success: false, error: result.error.message, code: result.error.code };
        }

        revalidatePath('/tin-tuc');
        revalidatePath('/admin/blogs');
        return { success: true };
    } catch (err: any) {
        console.error('Failed to save blog:', err);
        return { success: false, error: err?.message || 'Server error' };
    }
}

export async function toggleBlogPublishStatus(id: string, newStatus: boolean) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('admin_session')?.value;
        const valid = await verifyToken(token);

        if (!valid) {
            return { success: false, error: 'Unauthorized' };
        }

        const { error } = await supabaseAdmin
            .from('blogs')
            .update({ is_published: newStatus, updated_at: new Date().toISOString() })
            .eq('id', id);

        if (error) {
            console.error('Error toggling blog publish status:', error);
            return { success: false, error: error.message };
        }

        revalidatePath('/tin-tuc');
        revalidatePath('/admin/blogs');
        return { success: true };
    } catch (err: any) {
        console.error('Failed to toggle blog status:', err);
        return { success: false, error: err?.message || 'Server error' };
    }
}

export async function deleteBlog(id: string) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('admin_session')?.value;
        const valid = await verifyToken(token);

        if (!valid) {
            return { success: false, error: 'Unauthorized' };
        }

        const { error } = await supabaseAdmin
            .from('blogs')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting blog:', error);
            return { success: false, error: error.message };
        }

        revalidatePath('/tin-tuc');
        revalidatePath('/admin/blogs');
        return { success: true };
    } catch (err: any) {
        console.error('Failed to delete blog:', err);
        return { success: false, error: err?.message || 'Server error' };
    }
}
