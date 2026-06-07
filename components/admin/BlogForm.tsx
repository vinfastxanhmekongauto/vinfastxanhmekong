'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Upload, Trash2, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import RichTextEditor from './rich-text-editor';
import { supabase } from '@/lib/supabase';

export type BlogFormData = {
    title: string;
    slug: string;
    category: string;
    excerpt: string;
    content: string;
    thumbnail_url: string | null;
    meta_title: string;
    meta_description: string;
    meta_keywords: string;
    is_published: boolean;
};

interface BlogFormProps {
    initialData?: BlogFormData;
    onSubmit: (data: BlogFormData) => Promise<void>;
    isSubmitting: boolean;
    titleLabel: string;
}

const CATEGORIES = ['Tin tức VinFast', 'Sự kiện Showroom', 'Hướng dẫn sử dụng xe'];

export default function BlogForm({ initialData, onSubmit, isSubmitting, titleLabel }: BlogFormProps) {
    const [title, setTitle] = useState(initialData?.title || '');
    const [slug, setSlug] = useState(initialData?.slug || '');
    const [category, setCategory] = useState(initialData?.category || 'Tin tức VinFast');
    const [excerpt, setExcerpt] = useState(initialData?.excerpt || '');
    const [content, setContent] = useState(initialData?.content || '');
    const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(initialData?.thumbnail_url || null);
    const [metaTitle, setMetaTitle] = useState(initialData?.meta_title || '');
    const [metaDescription, setMetaDescription] = useState(initialData?.meta_description || '');
    const [metaKeywords, setMetaKeywords] = useState(initialData?.meta_keywords || '');
    const [isPublished, setIsPublished] = useState(initialData?.is_published ?? true);

    const [isUploading, setIsUploading] = useState(false);
    const [isUploadingImages, setIsUploadingImages] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);

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

    // Auto-generate slug on title changes if not manually edited
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

        if (!file.type.startsWith('image/')) {
            setUploadError('Vui lòng chọn file hình ảnh hợp lệ.');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setUploadError('Dung lượng ảnh vượt quá 5MB. Vui lòng chọn ảnh nhẹ hơn.');
            return;
        }

        setIsUploading(true);
        setUploadError(null);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('folder', 'blogs');

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Upload ảnh lên Supabase thất bại.');
            }

            setThumbnailUrl(data.url);
        } catch (err) {
            console.error(err);
            const message = err instanceof Error ? err.message : 'Lỗi xảy ra trong quá trình upload ảnh.';
            setUploadError(message);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleRemoveImage = () => {
        setThumbnailUrl(null);
        setUploadError(null);
    };

    const processAndUploadImages = async (htmlContent: string): Promise<string> => {
        if (!htmlContent) return htmlContent;

        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        const images = Array.from(doc.querySelectorAll('img'));

        const base64Images = images.filter((img) => img.src.startsWith('data:image/'));
        if (base64Images.length === 0) return htmlContent;

        for (const img of base64Images) {
            try {
                const src = img.src;
                const res = await fetch(src);
                const blob = await res.blob();

                const mimeType = blob.type || 'image/png';
                const ext = mimeType.split('/')[1] || 'png';
                const filename = `editor-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;
                const filePath = `blogs/${filename}`;

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('images')
                    .upload(filePath, blob, {
                        cacheControl: '3600',
                        upsert: false,
                    });

                if (uploadError) {
                    throw new Error(uploadError.message || 'Lỗi khi upload ảnh.');
                }

                const { data } = supabase.storage.from('images').getPublicUrl(uploadData.path);
                img.src = data.publicUrl;
            } catch (error) {
                console.error('Lỗi khi tải lên hình ảnh Base64:', error);
                throw error;
            }
        }

        return doc.body.innerHTML;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);

        if (!title.trim()) {
            setFormError('Vui lòng nhập tiêu đề bài viết.');
            return;
        }

        if (!slug.trim()) {
            setFormError('Vui lòng nhập đường dẫn (slug).');
            return;
        }

        const slugRegex = /^[a-z0-9-]+$/;
        if (!slugRegex.test(slug)) {
            setFormError('Slug không hợp lệ. Chỉ được chứa chữ thường không dấu, số và dấu gạch ngang (-).');
            return;
        }

        if (!content.trim() || content === '<p></p>') {
            setFormError('Vui lòng nhập nội dung bài viết.');
            return;
        }

        setIsUploadingImages(true);

        try {
            const cleanContent = await processAndUploadImages(content);
            await onSubmit({
                title: title.trim(),
                slug: slug.trim(),
                category,
                excerpt: excerpt.trim(),
                content: cleanContent,
                thumbnail_url: thumbnailUrl,
                meta_title: metaTitle.trim(),
                meta_description: metaDescription.trim(),
                meta_keywords: metaKeywords.trim(),
                is_published: isPublished,
            });
        } catch (err) {
            console.error(err);
            const message = err instanceof Error ? err.message : 'Có lỗi xảy ra khi xử lý hình ảnh hoặc lưu bài viết.';
            setFormError(message);
        } finally {
            setIsUploadingImages(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Back to List */}
            <div className="flex items-center gap-4">
                <Link
                    href="/admin/blogs"
                    className="p-2 border border-gray-200 rounded-lg hover:bg-white text-gray-600 hover:text-gray-900 transition-colors bg-gray-50/50 shadow-xs"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h2 className="text-2xl font-bold text-gray-800 font-display">{titleLabel}</h2>
            </div>

            {formError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm flex items-start gap-3 animate-fade-in-down">
                    <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
                    <span className="font-medium">{formError}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                <div className="p-6 md:p-8 space-y-6">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <h3 className="text-base font-bold text-gray-900 border-l-4 border-vinfast-blue pl-3 font-display uppercase">
                            Thông Tin Bài Viết
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 block">
                                    Tiêu đề <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={title}
                                    onChange={handleTitleChange}
                                    placeholder="VD: Hướng dẫn sử dụng xe điện VinFast VF 5"
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
                                    placeholder="huong-dan-su-dung-xe-dien-vf-5"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vinfast-blue/50 focus:border-vinfast-blue transition-all bg-white text-gray-800 text-sm font-mono"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 block">
                                    Chuyên mục <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vinfast-blue/50 focus:border-vinfast-blue transition-all bg-white text-gray-800 text-sm font-medium"
                                >
                                    {CATEGORIES.map((cat) => (
                                        <option key={cat} value={cat}>
                                            {cat}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 block">
                                    Trạng thái hiển thị
                                </label>
                                <div className="flex items-center pt-2">
                                    <label className="relative inline-flex items-center cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={isPublished}
                                            onChange={(e) => setIsPublished(e.target.checked)}
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-vinfast-blue"></div>
                                        <span className="ml-3 text-sm font-semibold text-gray-700">
                                            Xuất bản công khai bài viết
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Thumbnail Image */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 block">
                                Ảnh đại diện (Thumbnail)
                            </label>

                            {thumbnailUrl ? (
                                <div className="relative rounded-xl border border-gray-200 overflow-hidden bg-gray-50 max-w-md shadow-sm group">
                                    <div className="relative aspect-video w-full">
                                        <Image
                                            src={thumbnailUrl}
                                            alt="Thumbnail preview"
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                    </div>
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button
                                            type="button"
                                            onClick={handleRemoveImage}
                                            className="p-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition-all transform scale-90 group-hover:scale-100 shadow-md cursor-pointer"
                                            title="Xóa ảnh"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-vinfast-blue hover:bg-blue-50/20 transition-all ${isUploading ? 'pointer-events-none' : ''}`}
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
                                            <p className="text-sm font-medium text-gray-500">Đang tải ảnh lên...</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center space-y-2 py-2">
                                            <div className="p-3 bg-gray-100 rounded-full text-gray-400">
                                                <Upload className="w-6 h-6" />
                                            </div>
                                            <p className="text-sm font-semibold text-gray-600">Nhấp để tải ảnh đại diện</p>
                                            <p className="text-xs text-gray-400 font-medium">Chấp nhận JPG, PNG, WEBP (Tối đa 5MB)</p>
                                        </div>
                                    )}
                                </div>
                            )}
                            {uploadError && (
                                <p className="text-xs text-red-600 font-semibold flex items-center gap-1">
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    {uploadError}
                                </p>
                            )}
                        </div>
                    </div>

                    <hr className="border-gray-200" />

                    {/* Excerpt Summary */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 block">
                            Tóm tắt ngắn (Excerpt)
                        </label>
                        <textarea
                            value={excerpt}
                            onChange={(e) => setExcerpt(e.target.value)}
                            placeholder="Mô tả ngắn gọn nội dung bài viết để hiển thị trên trang danh sách tin..."
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vinfast-blue/50 focus:border-vinfast-blue transition-all bg-white text-gray-800 text-sm leading-relaxed"
                        />
                    </div>

                    {/* Content Editor */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 block">
                            Nội dung chi tiết <span className="text-red-500">*</span>
                        </label>
                        <RichTextEditor value={content} onChange={setContent} />
                    </div>

                    <hr className="border-gray-200" />

                    {/* SEO Metadata */}
                    <div className="space-y-4">
                        <h3 className="text-base font-bold text-gray-900 border-l-4 border-vinfast-blue pl-3 font-display uppercase">
                            Cấu Hình SEO (Tùy chọn)
                        </h3>
                        
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 block">
                                Meta Title
                            </label>
                            <input
                                type="text"
                                value={metaTitle}
                                onChange={(e) => setMetaTitle(e.target.value)}
                                placeholder="Tiêu đề hiển thị trên Google tìm kiếm"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vinfast-blue/50 focus:border-vinfast-blue transition-all bg-white text-gray-800 text-sm"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 block">
                                    Meta Description
                                </label>
                                <textarea
                                    value={metaDescription}
                                    onChange={(e) => setMetaDescription(e.target.value)}
                                    placeholder="Đoạn mô tả ngắn hiển thị dưới tiêu đề trang trên Google..."
                                    rows={3}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vinfast-blue/50 focus:border-vinfast-blue transition-all bg-white text-gray-800 text-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 block">
                                    Meta Keywords
                                </label>
                                <input
                                    type="text"
                                    value={metaKeywords}
                                    onChange={(e) => setMetaKeywords(e.target.value)}
                                    placeholder="Từ khóa phân tách bằng dấu phẩy (VD: tin vinfast, xe dien vinfast)"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vinfast-blue/50 focus:border-vinfast-blue transition-all bg-white text-gray-800 text-sm"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Submit actions */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                    <Link
                        href="/admin/blogs"
                        className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors text-sm font-semibold bg-white"
                    >
                        Hủy
                    </Link>
                    <button
                        type="submit"
                        disabled={isSubmitting || isUploading || isUploadingImages}
                        className="px-5 py-2.5 bg-vinfast-blue text-white rounded-lg hover:bg-blue-800 transition-colors text-sm font-semibold disabled:opacity-50 flex items-center gap-2 shadow-xs cursor-pointer"
                    >
                        {(isSubmitting || isUploadingImages) && (
                            <Loader2 className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        )}
                        {isUploadingImages ? 'Đang xử lý hình ảnh...' : 'Lưu bài viết'}
                    </button>
                </div>
            </form>
        </div>
    );
}
