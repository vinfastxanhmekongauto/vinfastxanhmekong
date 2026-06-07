'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveBlog } from '@/app/actions/blogs';
import BlogForm, { BlogFormData } from '@/components/admin/BlogForm';

export default function CreateBlogPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (formData: BlogFormData) => {
        setIsSubmitting(true);
        try {
            const result = await saveBlog(formData);
            
            if (!result.success) {
                // If it is a unique constraint error (e.g. slug already exists)
                if (result.code === '23505') {
                    throw new Error('Đường dẫn (slug) này đã tồn tại. Vui lòng chỉnh sửa lại đường dẫn.');
                }
                throw new Error(result.error || 'Có lỗi xảy ra khi tạo bài viết.');
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

    return (
        <div className="py-2">
            <BlogForm
                titleLabel="Tạo Mới Bài Viết"
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
            />
        </div>
    );
}
