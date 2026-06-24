'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveJob } from '@/app/actions/jobs';
import JobForm, { JobFormData } from '@/components/admin/JobForm';

export default function CreateJobPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (formData: JobFormData) => {
        setIsSubmitting(true);
        try {
            const result = await saveJob(formData);
            
            if (!result.success) {
                // If it is a unique constraint error (e.g. slug already exists)
                if (result.code === '23505') {
                    throw new Error('Đường dẫn (slug) này đã tồn tại. Vui lòng chỉnh sửa lại đường dẫn.');
                }
                throw new Error(result.error || 'Có lỗi xảy ra khi tạo tin tuyển dụng.');
            }
        } catch (err) {
            console.error(err);
            throw err;
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <JobForm
            titleLabel="Tạo Mới Tin Tuyển Dụng"
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
        />
    );
}
