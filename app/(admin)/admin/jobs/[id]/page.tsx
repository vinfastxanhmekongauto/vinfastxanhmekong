'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import JobForm, { JobFormData } from '@/components/admin/JobForm';
import { Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function EditJobPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;

    const [job, setJob] = useState<JobFormData | null>(null);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!id) return;
        
        const fetchJob = async () => {
            setLoading(true);
            setFetchError(null);
            try {
                const { data, error } = await supabase
                    .from('jobs')
                    .select('title, slug, cover_image, header_content, footer_content, positions, is_active')
                    .eq('id', id)
                    .single();
                
                if (error) throw error;
                if (!data) throw new Error('Không tìm thấy tin tuyển dụng.');
                
                setJob(data as JobFormData);
            } catch (err) {
                console.error(err);
                const message = err instanceof Error ? err.message : 'Lỗi khi tải dữ liệu tin tuyển dụng.';
                setFetchError(message);
            } finally {
                setLoading(false);
            }
        };

        fetchJob();
    }, [id]);

    const handleUpdate = async (formData: JobFormData) => {
        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from('jobs')
                .update(formData)
                .eq('id', id);
            
            if (error) {
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

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
                <Loader2 className="w-8 h-8 text-vinfast-blue animate-spin" />
                <p className="text-sm font-semibold text-gray-500">Đang tải tin tuyển dụng...</p>
            </div>
        );
    }

    if (fetchError || !job) {
        return (
            <div className="max-w-md mx-auto mt-12 bg-white rounded-xl shadow border border-gray-200 p-6 text-center space-y-4">
                <div className="p-3 bg-red-100 text-red-600 rounded-full w-fit mx-auto">
                    <AlertCircle className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Không tìm thấy tin tuyển dụng</h3>
                <p className="text-sm text-gray-500">{fetchError || 'Tin tuyển dụng không tồn tại hoặc đã bị xóa.'}</p>
                <Link
                    href="/admin/jobs"
                    className="inline-block px-4 py-2 bg-vinfast-blue text-white rounded-lg hover:bg-blue-800 text-sm font-semibold transition-colors shadow-sm"
                >
                    Quay lại danh sách
                </Link>
            </div>
        );
    }

    return (
        <div className="py-2">
            <JobForm
                titleLabel="Chỉnh Sửa Tin Tuyển Dụng"
                initialData={job}
                onSubmit={handleUpdate}
                isSubmitting={isSubmitting}
            />
        </div>
    );
}
