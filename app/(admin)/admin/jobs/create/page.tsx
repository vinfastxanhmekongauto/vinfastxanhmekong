'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import JobForm, { JobFormData } from '@/components/admin/JobForm';

export default function CreateJobPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (formData: JobFormData) => {
        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from('jobs')
                .insert([formData]);
            
            if (error) {
                // If it is a unique constraint error (e.g. slug already exists)
                if (error.code === '23505') {
                    throw new Error('Đường dẫn (slug) này đã tồn tại. Vui lòng chỉnh sửa lại đường dẫn.');
                }
                throw error;
            }
            
            // Redirect to admin jobs list page
            router.push('/admin/jobs');
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
            <JobForm
                titleLabel="Tạo Mới Tin Tuyển Dụng"
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
            />
        </div>
    );
}
