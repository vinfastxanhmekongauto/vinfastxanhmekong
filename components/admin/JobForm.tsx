'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Upload, Trash2, Loader2, AlertCircle, ArrowLeft, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export type PositionFormData = {
    role: string;
    quantity: string;
    qualification: string;
    location: string;
    description: string;
    requirements: string;
    salary: string;
    experience: string;
    deadline: string;
    isUrgent: boolean;
    jobTypes: string[];
    benefits: string[];
    thumbnail_url: string;
};

export type JobFormData = {
    positions: PositionFormData[];
    is_active: boolean;
    required_documents?: string;
};

interface JobFormProps {
    initialData?: JobFormData;
    onSubmit: (data: JobFormData) => Promise<void>;
    isSubmitting: boolean;
    titleLabel: string;
}

const defaultRequiredDocuments = `- Đơn xin việc / CV cá nhân.
- Sơ yếu lý lịch (có xác nhận của địa phương).
- Bản sao CMND/CCCD (không cần công chứng).
- Bản sao các văn bằng, chứng chỉ liên quan.
- Giấy khám sức khỏe (trong vòng 6 tháng).`;

export default function JobForm({ initialData, onSubmit, isSubmitting, titleLabel }: JobFormProps) {
    const [requiredDocuments, setRequiredDocuments] = useState(initialData?.required_documents || defaultRequiredDocuments);

    // Dynamic positions array (starts blank if creating new) safely mapped with mock/rich values
    const [positions, setPositions] = useState<PositionFormData[]>(() => {
        if (!initialData?.positions) return [];
        return initialData.positions.map(pos => ({
            role: pos.role || '',
            quantity: pos.quantity || '',
            qualification: pos.qualification || '',
            location: pos.location || '',
            description: pos.description || '',
            requirements: pos.requirements || '',
            salary: (pos as any).salary || '',
            experience: (pos as any).experience || '',
            deadline: (pos as any).deadline || '',
            isUrgent: (pos as any).isUrgent || false,
            jobTypes: (pos as any).jobTypes || [],
            benefits: (pos as any).benefits || [],
            thumbnail_url: (pos as any).thumbnail_url || '/banner-tuyen-dung.webp'
        }));
    });

    // States for upload and errors
    const [isUploadingPos, setIsUploadingPos] = useState<Record<number, boolean>>({});
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validation
        if (!file.type.startsWith('image/')) {
            setUploadError('Vui lòng chọn file hình ảnh hợp lệ.');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setUploadError('Dung lượng ảnh vượt quá 5MB. Vui lòng chọn ảnh nhẹ hơn.');
            return;
        }

        setIsUploadingPos(prev => ({ ...prev, [index]: true }));
        setUploadError(null);

        try {
            const currentUrl = positions[index]?.thumbnail_url;
            
            // Delete old file from storage if valid and not fallback
            if (currentUrl && currentUrl !== "/banner-tuyen-dung.webp" && currentUrl.includes("supabase.co")) {
                const match = currentUrl.match(/\/images\/(.+)$/);
                if (match && match[1]) {
                    const oldPath = decodeURIComponent(match[1]);
                    await supabase.storage.from('images').remove([oldPath]);
                }
            }

            // Upload new file to images bucket under jobs/ directory
            const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '');
            const filePath = `jobs/${Date.now()}_${cleanFileName}`;
            
            const { error: uploadError } = await supabase.storage
                .from('images')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Get public URL
            const { data } = supabase.storage.from('images').getPublicUrl(filePath);
            if (!data?.publicUrl) throw new Error("Không lấy được đường dẫn ảnh công khai.");

            handlePositionChange(index, 'thumbnail_url', data.publicUrl);
        } catch (err) {
            console.error(err);
            const message = err instanceof Error ? err.message : 'Lỗi xảy ra trong quá trình upload ảnh thẻ.';
            setUploadError(message);
        } finally {
            setIsUploadingPos(prev => ({ ...prev, [index]: false }));
        }
    };

    // Position updates
    const handlePositionChange = (index: number, field: keyof PositionFormData, value: any) => {
        setPositions(prev => prev.map((pos, idx) => idx === index ? { ...pos, [field]: value } : pos));
    };

    const handleAddPosition = () => {
        setPositions(prev => [
            ...prev,
            {
                role: '',
                quantity: '',
                qualification: '',
                location: '',
                description: '',
                requirements: '',
                salary: '',
                experience: '',
                deadline: '',
                isUrgent: false,
                jobTypes: [],
                benefits: [],
                thumbnail_url: '/banner-tuyen-dung.webp'
            }
        ]);
    };

    const handleRemovePosition = (index: number) => {
        setPositions(prev => prev.filter((_, idx) => idx !== index));
    };

    const [isActive, setIsActive] = useState(initialData?.is_active ?? true);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);

        for (let i = 0; i < positions.length; i++) {
            const pos = positions[i];
            if (!pos.role.trim()) {
                setFormError(`Vui lòng nhập Tên vị trí tuyển dụng tại vị trí thứ #${i + 1}.`);
                return;
            }
        }

        try {
            await onSubmit({
                required_documents: requiredDocuments.trim(),
                positions: positions.map(pos => ({
                    role: pos.role.trim(),
                    quantity: pos.quantity.trim(),
                    qualification: pos.qualification.trim(),
                    location: pos.location.trim(),
                    description: pos.description.trim(),
                    requirements: pos.requirements.trim(),
                    salary: (pos.salary || '').trim(),
                    experience: (pos.experience || '').trim(),
                    deadline: (pos.deadline || '').trim(),
                    isUrgent: !!pos.isUrgent,
                    jobTypes: pos.jobTypes || [],
                    benefits: pos.benefits || [],
                    thumbnail_url: (pos.thumbnail_url || '').trim()
                })),
                is_active: isActive,
            });
        } catch (err) {
            console.error(err);
            const message = err instanceof Error ? err.message : 'Có lỗi xảy ra khi lưu tin tuyển dụng.';
            setFormError(message);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Back to List */}
            <div className="flex items-center gap-4">
                <Link
                    href="/admin/jobs"
                    className="p-2 border border-gray-200 rounded-lg hover:bg-white text-gray-600 hover:text-gray-900 transition-colors bg-gray-50/50 shadow-xs"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h2 className="text-2xl font-bold text-gray-800">{titleLabel}</h2>
            </div>

            {formError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm flex items-start gap-3 animate-fade-in-down">
                    <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
                    <span className="font-medium">{formError}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                <div className="p-6 md:p-8 space-y-6">

                    {/* Part 1: Campaign Configuration */}
                    <div className="space-y-4">
                        <h3 className="text-base font-bold text-gray-900 border-l-4 border-vinfast-blue pl-3">
                            Cấu Hình Chiến Dịch Tuyển Dụng
                        </h3>

                        {/* Status Toggle */}
                        <div className="flex items-center py-2">
                            <label className="relative inline-flex items-center cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={isActive}
                                    onChange={(e) => setIsActive(e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-vinfast-blue"></div>
                                <span className="ml-3 text-sm font-semibold text-gray-700">
                                    Hiển thị công khai chiến dịch (Cho phép ứng tuyển)
                                </span>
                            </label>
                        </div>

                        {/* Hồ sơ bao gồm (Required Documents - Markdown) */}
                        <div className="space-y-2 pt-2">
                            <label className="text-sm font-semibold text-gray-700 block">
                                Hồ sơ bao gồm (Required Documents - Markdown)
                            </label>
                            <textarea
                                value={requiredDocuments}
                                onChange={(e) => setRequiredDocuments(e.target.value)}
                                placeholder="- Đơn xin việc / CV cá nhân.&#10;- Sơ yếu lý lịch..."
                                rows={4}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vinfast-blue/50 focus:border-vinfast-blue transition-all bg-white text-gray-800 text-sm font-mono leading-relaxed"
                            />
                        </div>
                    </div>

                    <hr className="border-gray-200" />

                    {/* Part 3: Positions Dynamic Array */}
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-base font-bold text-gray-900 border-l-4 border-vinfast-blue pl-3">
                                Các Vị Trí Cần Tuyển Dụng
                            </h3>
                            <button
                                type="button"
                                onClick={handleAddPosition}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-vinfast-blue border border-blue-100 rounded-lg hover:bg-blue-100 hover:text-blue-800 transition-colors text-xs font-bold cursor-pointer"
                            >
                                <Plus className="w-4 h-4" />
                                Thêm vị trí mới
                            </button>
                        </div>

                        {positions.length === 0 ? (
                            <div className="text-center py-8 border border-dashed border-gray-300 rounded-xl text-gray-400 text-sm">
                                Chưa có vị trí tuyển dụng nào. Vui lòng bấm Thêm vị trí mới.
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {positions.map((pos, index) => (
                                    <div
                                        key={index}
                                        className="relative bg-gray-50/50 border border-gray-200 rounded-xl p-4 md:p-6 space-y-4 shadow-sm"
                                    >
                                        {/* Header Position Title & Remove Action */}
                                        <div className="flex justify-between items-center">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-vinfast-blue">
                                                Vị trí #{index + 1}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => handleRemovePosition(index)}
                                                className="p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors cursor-pointer"
                                                title="Xóa vị trí này"
                                            >
                                                <Trash2 className="w-4.5 h-4.5" />
                                            </button>
                                        </div>

                                        {/* Fields Grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-gray-600">
                                                    Vị trí tuyển dụng (Role) <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={pos.role}
                                                    onChange={(e) => handlePositionChange(index, 'role', e.target.value)}
                                                    placeholder="VD: Kỹ Thuật Viên Sửa Chữa Ô Tô"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-800 font-medium focus:outline-none focus:ring-1 focus:ring-vinfast-blue"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-gray-600">
                                                    Số lượng tuyển (Quantity)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={pos.quantity}
                                                    onChange={(e) => handlePositionChange(index, 'quantity', e.target.value)}
                                                    placeholder="VD: 3 người / Không giới hạn"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-vinfast-blue"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-gray-600">
                                                    Yêu cầu bằng cấp (Qualification)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={pos.qualification}
                                                    onChange={(e) => handlePositionChange(index, 'qualification', e.target.value)}
                                                    placeholder="VD: Cao đẳng nghề công nghệ ô tô trở lên"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-vinfast-blue"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-gray-600">
                                                    Địa điểm (Location)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={pos.location}
                                                    onChange={(e) => handlePositionChange(index, 'location', e.target.value)}
                                                    placeholder="VD: Showroom VinFast Xanh Mekong Cần Thơ"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-vinfast-blue"
                                                />
                                            </div>
                                        </div>

                                        {/* New Grid for salary, experience, deadline, thumbnail, jobTypes, isUrgent */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-gray-600">
                                                    Mức lương (Salary)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={pos.salary}
                                                    onChange={(e) => handlePositionChange(index, 'salary', e.target.value)}
                                                    placeholder="VD: 7 - 10 triệu / Thỏa thuận"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-vinfast-blue"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-gray-600">
                                                    Kinh nghiệm (Experience)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={pos.experience}
                                                    onChange={(e) => handlePositionChange(index, 'experience', e.target.value)}
                                                    placeholder="VD: 1 năm / Không yêu cầu"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-vinfast-blue"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-gray-600">
                                                    Hạn nộp hồ sơ (Deadline)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={pos.deadline}
                                                    onChange={(e) => handlePositionChange(index, 'deadline', e.target.value)}
                                                    placeholder="VD: 30/06/2026"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-vinfast-blue"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-gray-600">
                                                    Ảnh thẻ/ảnh đại diện (Thumbnail)
                                                </label>
                                                <div className="flex items-center gap-3">
                                                    <div className="relative w-12 h-12 rounded-lg border border-gray-200 overflow-hidden bg-gray-50 shrink-0">
                                                        <Image
                                                            src={pos.thumbnail_url || "/banner-tuyen-dung.webp"}
                                                            alt="Thumbnail preview"
                                                            fill
                                                            className="object-cover"
                                                            unoptimized
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={(e) => handleImageUpload(e, index)}
                                                            className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                                                            disabled={isUploadingPos[index]}
                                                        />
                                                        {isUploadingPos[index] && (
                                                            <p className="text-[10px] text-blue-600 font-medium animate-pulse mt-0.5">
                                                                Đang tải ảnh lên...
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-gray-600">
                                                    Phân loại công việc (Job Types - cách nhau bằng dấu phẩy)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={pos.jobTypes?.join(', ') || ''}
                                                    onChange={(e) => handlePositionChange(index, 'jobTypes', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                                                    placeholder="VD: Kinh doanh, Toàn thời gian"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-vinfast-blue"
                                                />
                                            </div>
                                            <div className="flex items-center pt-5">
                                                <label className="relative inline-flex items-center cursor-pointer select-none">
                                                    <input
                                                        type="checkbox"
                                                        className="sr-only peer"
                                                        checked={pos.isUrgent}
                                                        onChange={(e) => handlePositionChange(index, 'isUrgent', e.target.checked)}
                                                    />
                                                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-500"></div>
                                                    <span className="ml-3 text-xs font-semibold text-gray-700">
                                                        Đánh dấu là Tuyển gấp (Tuyển gấp)
                                                    </span>
                                                </label>
                                            </div>
                                        </div>

                                        <div className="space-y-1 pt-2">
                                            <label className="text-xs font-semibold text-gray-600">
                                                Quyền lợi & Phúc lợi (Benefits - mỗi dòng 1 ý)
                                            </label>
                                            <textarea
                                                value={pos.benefits?.join('\n') || ''}
                                                onChange={(e) => handlePositionChange(index, 'benefits', e.target.value.split('\n').filter(Boolean))}
                                                placeholder="VD: Thu nhập hấp dẫn (lương cứng + hoa hồng)&#10;Được đóng BHXH đầy đủ..."
                                                rows={3}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-vinfast-blue leading-relaxed"
                                            />
                                        </div>

                                        {/* Description and Requirements textareas */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-gray-600">
                                                    Mô tả công việc (Markdown)
                                                </label>
                                                <textarea
                                                    value={pos.description}
                                                    onChange={(e) => handlePositionChange(index, 'description', e.target.value)}
                                                    placeholder="- Thực hiện sửa chữa ôtô điện&#10;- Báo cáo cấp trên..."
                                                    rows={5}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-800 font-mono focus:outline-none focus:ring-1 focus:ring-vinfast-blue leading-relaxed"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-gray-600">
                                                    Yêu cầu công việc (Markdown)
                                                </label>
                                                <textarea
                                                    value={pos.requirements}
                                                    onChange={(e) => handlePositionChange(index, 'requirements', e.target.value)}
                                                    placeholder="- Tối thiểu 1 năm kinh nghiệm&#10;- Chịu khó học hỏi..."
                                                    rows={5}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-800 font-mono focus:outline-none focus:ring-1 focus:ring-vinfast-blue leading-relaxed"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                    <Link
                        href="/admin/jobs"
                        className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors text-sm font-semibold bg-white"
                    >
                        Hủy
                    </Link>
                    <button
                        type="submit"
                        disabled={isSubmitting || Object.values(isUploadingPos).some(Boolean)}
                        className="px-5 py-2.5 bg-vinfast-blue text-white rounded-lg hover:bg-blue-800 transition-colors text-sm font-semibold disabled:opacity-50 flex items-center gap-2 shadow-xs cursor-pointer"
                    >
                        {isSubmitting && (
                            <Loader2 className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        )}
                        Lưu Chiến Dịch Tuyển Dụng
                    </button>
                </div>
            </form>
        </div>
    );
}
