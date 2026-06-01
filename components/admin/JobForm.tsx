'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Upload, Trash2, Loader2, AlertCircle, ArrowLeft, Plus } from 'lucide-react';

export type PositionFormData = {
    role: string;
    quantity: string;
    qualification: string;
    location: string;
    description: string;
    requirements: string;
};

export type JobFormData = {
    title: string;
    slug: string;
    cover_image: string | null;
    header_content: string;
    footer_content: string;
    positions: PositionFormData[];
    is_active: boolean;
};

interface JobFormProps {
    initialData?: JobFormData;
    onSubmit: (data: JobFormData) => Promise<void>;
    isSubmitting: boolean;
    titleLabel: string;
}

export default function JobForm({ initialData, onSubmit, isSubmitting, titleLabel }: JobFormProps) {
    const [title, setTitle] = useState(initialData?.title || '');
    const [slug, setSlug] = useState(initialData?.slug || '');
    const [coverImage, setCoverImage] = useState<string | null>(initialData?.cover_image || null);
    const [headerContent, setHeaderContent] = useState(initialData?.header_content || '');
    const [footerContent, setFooterContent] = useState(initialData?.footer_content || '');
    
    // Dynamic positions array (initially has at least one blank position if editing is blank)
    const [positions, setPositions] = useState<PositionFormData[]>(
        initialData?.positions || [
            { role: '', quantity: '', qualification: '', location: '', description: '', requirements: '' }
        ]
    );

    // States for upload and errors
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);

    // Flag to check if slug has been customized manually
    const isSlugCustomized = useRef(initialData?.slug ? true : false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const generateSlug = (text: string) =>
        text.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
            .replace(/\s+/g, '-') // Replace spaces with -
            .replace(/[^\w-]+/g, '') // Remove non-word chars
            .replace(/--+/g, '-') // Replace multiple - with single -
            .replace(/^-+/, '') // Trim - from start
            .replace(/-+$/, ''); // Trim - from end

    // Automatic slug generation as title changes
    useEffect(() => {
        if (!isSlugCustomized.current) {
            setSlug(generateSlug(title));
        }
    }, [title]);

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTitle(e.target.value);
    };

    const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        isSlugCustomized.current = true;
        setSlug(e.target.value);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Basic validation
        if (!file.type.startsWith('image/')) {
            setUploadError('Vui lòng chọn file hình ảnh hợp lệ.');
            return;
        }

        // Limit size to 5MB
        if (file.size > 5 * 1024 * 1024) {
            setUploadError('Dung lượng ảnh vượt quá 5MB. Vui lòng chọn ảnh nhẹ hơn.');
            return;
        }

        setIsUploading(true);
        setUploadError(null);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('folder', 'jobs');

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Upload ảnh lên Supabase thất bại.');
            }

            setCoverImage(data.url);
        } catch (err) {
            console.error(err);
            const message = err instanceof Error ? err.message : 'Lỗi xảy ra trong quá trình upload ảnh.';
            setUploadError(message);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = ''; // Reset file input
            }
        }
    };

    const handleRemoveImage = () => {
        setCoverImage(null);
        setUploadError(null);
    };

    // Position updates
    const handlePositionChange = (index: number, field: keyof PositionFormData, value: string) => {
        setPositions(prev => prev.map((pos, idx) => idx === index ? { ...pos, [field]: value } : pos));
    };

    const handleAddPosition = () => {
        setPositions(prev => [...prev, { role: '', quantity: '', qualification: '', location: '', description: '', requirements: '' }]);
    };

    const handleRemovePosition = (index: number) => {
        setPositions(prev => prev.filter((_, idx) => idx !== index));
    };

    const [isActive, setIsActive] = useState(initialData?.is_active ?? true);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);

        // Validation checks
        if (!title.trim()) {
            setFormError('Vui lòng nhập tiêu đề tuyển dụng.');
            return;
        }

        if (!slug.trim()) {
            setFormError('Vui lòng nhập đường dẫn (slug).');
            return;
        }

        // Verify slug format (only letters, numbers, hyphens)
        const slugRegex = /^[a-z0-9-]+$/;
        if (!slugRegex.test(slug)) {
            setFormError('Slug không hợp lệ. Chỉ được chứa chữ thường không dấu, số và dấu gạch ngang (-).');
            return;
        }

        // Validate positions
        if (positions.length === 0) {
            setFormError('Chiến dịch tuyển dụng phải chứa ít nhất một vị trí công việc.');
            return;
        }

        for (let i = 0; i < positions.length; i++) {
            const pos = positions[i];
            if (!pos.role.trim()) {
                setFormError(`Vui lòng nhập Tên vị trí tuyển dụng tại vị trí thứ #${i + 1}.`);
                return;
            }
        }

        try {
            await onSubmit({
                title: title.trim(),
                slug: slug.trim(),
                cover_image: coverImage,
                header_content: headerContent.trim(),
                footer_content: footerContent.trim(),
                positions: positions.map(pos => ({
                    role: pos.role.trim(),
                    quantity: pos.quantity.trim(),
                    qualification: pos.qualification.trim(),
                    location: pos.location.trim(),
                    description: pos.description.trim(),
                    requirements: pos.requirements.trim()
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
                    
                    {/* Part 1: Campaign Basic Info */}
                    <div className="space-y-4">
                        <h3 className="text-base font-bold text-gray-900 border-l-4 border-vinfast-blue pl-3">
                            Thông Tin Chiến Dịch Tuyển Dụng
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 block">
                                    Tiêu đề chiến dịch <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={title}
                                    onChange={handleTitleChange}
                                    placeholder="VD: Tuyển dụng các vị trí Showroom Tháng 6"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vinfast-blue/50 focus:border-vinfast-blue transition-all bg-white text-gray-800 text-sm font-medium"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 block">
                                    Đường dẫn (Slug) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={slug}
                                    onChange={handleSlugChange}
                                    placeholder="tuyen-dung-showroom-thang-6"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vinfast-blue/50 focus:border-vinfast-blue transition-all bg-white text-gray-800 text-sm font-mono"
                                />
                            </div>
                        </div>

                        {/* Cover Image */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 block">
                                Ảnh nền chiến dịch (Cover Image)
                            </label>
                            
                            {coverImage ? (
                                <div className="relative rounded-xl border border-gray-200 overflow-hidden bg-gray-50 max-w-lg shadow-sm group">
                                    <div className="relative aspect-video w-full">
                                        <Image
                                            src={coverImage}
                                            alt="Cover preview"
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                    </div>
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                        <button
                                            type="button"
                                            onClick={handleRemoveImage}
                                            className="p-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition-all transform scale-90 group-hover:scale-100 shadow-md"
                                            title="Xóa ảnh"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div 
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-vinfast-blue hover:bg-blue-50/20 transition-all ${isUploading ? 'pointer-events-none' : ''}`}
                                >
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        accept="image/*"
                                        className="hidden"
                                    />
                                    {isUploading ? (
                                        <div className="flex flex-col items-center justify-center space-y-3 py-2">
                                            <Loader2 className="w-8 h-8 text-vinfast-blue animate-spin" />
                                            <p className="text-sm font-medium text-gray-500">Đang upload ảnh lên Supabase Storage...</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center space-y-2 py-2">
                                            <div className="p-3 bg-gray-100 rounded-full text-gray-400">
                                                <Upload className="w-6 h-6" />
                                            </div>
                                            <p className="text-sm font-semibold text-gray-600">Nhấp để tải lên ảnh nền</p>
                                            <p className="text-xs text-gray-400">Chấp nhận JPG, PNG, WEBP (Tối đa 5MB)</p>
                                        </div>
                                    )}
                                </div>
                            )}
                            {uploadError && (
                                <p className="text-xs text-red-600 font-medium flex items-center gap-1">
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    {uploadError}
                                </p>
                            )}
                        </div>

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
                    </div>

                    <hr className="border-gray-200" />

                    {/* Part 2: Header / Footer Contents */}
                    <div className="space-y-6">
                        <h3 className="text-base font-bold text-gray-900 border-l-4 border-vinfast-blue pl-3">
                            Nội Dung Mô Tả Chiến Dịch (Markdown)
                        </h3>
                        
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 block">
                                Nội dung mở đầu chiến dịch (Header Content)
                            </label>
                            <textarea
                                value={headerContent}
                                onChange={(e) => setHeaderContent(e.target.value)}
                                placeholder="# VinFast Xanh Mekong tuyển dụng&#10;Chào mừng các bạn đến ứng tuyển..."
                                rows={4}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vinfast-blue/50 focus:border-vinfast-blue transition-all bg-white text-gray-800 text-sm font-mono leading-relaxed"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 block">
                                Nội dung kết thúc & hướng dẫn (Footer Content)
                            </label>
                            <textarea
                                value={footerContent}
                                onChange={(e) => setFooterContent(e.target.value)}
                                placeholder="### Quy trình tuyển dụng&#10;1. Nhận hồ sơ&#10;2. Phỏng vấn sơ loại..."
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
                                            {positions.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemovePosition(index)}
                                                    className="p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors cursor-pointer"
                                                    title="Xóa vị trí này"
                                                >
                                                    <Trash2 className="w-4.5 h-4.5" />
                                                </button>
                                            )}
                                        </div>

                                        {/* Fields Grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-gray-600">
                                                    Vị trí tuyển dụng (Role) <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    required
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

                                        {/* Description and Requirements textareas */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-gray-600">
                                                    Mô tả công việc (Markdown)
                                                </label>
                                                <textarea
                                                    value={pos.description}
                                                    onChange={(e) => handlePositionChange(index, 'description', e.target.value)}
                                                    placeholder="- Thực hiện sửa chữa xe máy điện&#10;- Báo cáo cấp trên..."
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
                        disabled={isSubmitting || isUploading}
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
