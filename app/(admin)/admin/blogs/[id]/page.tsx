'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { saveBlog } from '@/app/actions/blogs';
import BlogForm, { BlogFormData } from '@/components/admin/BlogForm';
import { Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function EditBlogPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;

    const [blog, setBlog] = useState<BlogFormData | null>(null);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!id) return;
        
        const fetchBlog = async () => {
            setLoading(true);
            setFetchError(null);
            try {
                const { data, error } = await supabase
                    .from('blogs')
                    .select('title, slug, category, excerpt, content, thumbnail_url, meta_title, meta_description, meta_keywords, is_published')
                    .eq('id', id)
                    .single();
                
                if (error) throw error;
                if (!data) throw new Error('Không tìm thấy bài viết.');
                
                setBlog(data as BlogFormData);
            } catch (err) {
                console.error(err);
                const message = err instanceof Error ? err.message : 'Lỗi khi tải dữ liệu bài viết.';
                setFetchError(message);
            } finally {
                setLoading(false);
            }
        };

        fetchBlog();
    }, [id]);

    const handleUpdate = async (formData: BlogFormData) => {
        setIsSubmitting(true);
        try {
            const result = await saveBlog(formData, id);
            
            if (!result.success) {
                if (result.code === '23505') {
                    throw new Error('Đường dẫn (slug) này đã tồn tại. Vui lòng chỉnh sửa lại đường dẫn.');
                }
                throw new Error(result.error || 'Có lỗi xảy ra khi cập nhật bài viết.');
            }
            
            // Redirect to admin blogs list page
            router.push('/admin/blogs');
            router.refresh();
        } catch (err) {
            console.error(err);
            throw err;
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
                <Loader2 className="w-8 h-8 text-vinfast-blue animate-spin" />
                <p className="text-sm font-semibold text-gray-500">Đang tải nội dung bài viết...</p>
            </div>
        );
    }

    if (fetchError || !blog) {
        return (
            <div className="max-w-md mx-auto mt-12 bg-white rounded-xl shadow border border-gray-200 p-6 text-center space-y-4">
                <div className="p-3 bg-red-100 text-red-600 rounded-full w-fit mx-auto">
                    <AlertCircle className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Không tìm thấy bài viết</h3>
                <p className="text-sm text-gray-500">{fetchError || 'Bài viết không tồn tại hoặc đã bị xóa.'}</p>
                <Link
                    href="/admin/blogs"
                    className="inline-block px-4 py-2 bg-vinfast-blue text-white rounded-lg hover:bg-blue-800 text-sm font-semibold transition-colors shadow-sm"
                >
                    Quay lại danh sách
                </Link>
            </div>
        );
    }

    return (
        <div className="py-2">
            <BlogForm
                titleLabel="Chỉnh Sửa Bài Viết"
                initialData={blog}
                onSubmit={handleUpdate}
                isSubmitting={isSubmitting}
            />
        </div>
    );
}
