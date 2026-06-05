'use client';

import { useState, useEffect } from 'react';
import { Save, Loader2, Info, Wrench, ImageIcon, Edit3, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { updateServiceSettings } from '@/app/actions/service-settings';

// Extract storage file path from a full Supabase public URL
function getStoragePathFromUrl(url: string): string | null {
    if (!url) return null;
    const marker = '/storage/v1/object/public/images/';
    const index = url.indexOf(marker);
    if (index !== -1) {
        return url.substring(index + marker.length);
    }
    return null;
}

// Safely delete an image from the storage bucket
async function deleteOldImage(url: string) {
    try {
        const path = getStoragePathFromUrl(url);
        if (path) {
            console.log('Deleting orphaned storage file:', path);
            const { error } = await supabase.storage.from('images').remove([path]);
            if (error) {
                console.error('Error deleting old file from storage:', error);
            } else {
                console.log('Successfully deleted old file from storage:', path);
            }
        }
    } catch (err) {
        console.error('Failed to run storage delete logic:', err);
    }
}

interface ServiceSettingsProps {
    type: 'booking' | 'care' | 'gifts';
    title?: string;
}

export default function ServiceSettings({ type, title }: ServiceSettingsProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [markdownTab, setMarkdownTab] = useState<'write' | 'preview'>('write');

    const [bannerUrl, setBannerUrl] = useState('');
    const [ogImageUrl, setOgImageUrl] = useState('');
    const [contentMarkdown, setContentMarkdown] = useState('');
    const [isActive, setIsActive] = useState(true);

    const [bannerFile, setBannerFile] = useState<File | null>(null);
    const [ogFile, setOgFile] = useState<File | null>(null);

    const [bannerPreview, setBannerPreview] = useState<string | null>(null);
    const [ogPreview, setOgPreview] = useState<string | null>(null);

    useEffect(() => {
        fetchSettings();
    }, [type]);

    const fetchSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('service_settings')
                .select('*')
                .eq('service_type', type)
                .single();

            if (error) {
                console.error('Error fetching service settings:', error);
                setMessage({ type: 'error', text: 'Không thể tải cấu hình dịch vụ.' });
                return;
            }

            if (data) {
                setBannerUrl(data.banner_url || '');
                setOgImageUrl(data.og_image_url || '');
                setBannerPreview(data.banner_url || null);
                setOgPreview(data.og_image_url || null);
                setContentMarkdown(data.content_markdown || '');
                setIsActive(data.is_active !== false);
            }
        } catch (error) {
            console.error('Failed to fetch settings', error);
            setMessage({ type: 'error', text: 'Đã xảy ra lỗi khi tải cấu hình.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileChange = (type: 'banner' | 'og', e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const previewUrl = URL.createObjectURL(file);

        if (type === 'banner') {
            setBannerFile(file);
            setBannerPreview(previewUrl);
        } else {
            setOgFile(file);
            setOgPreview(previewUrl);
        }
    };

    const uploadMedia = async (file: File, folder: string): Promise<string> => {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('folder', folder);
        
        const res = await fetch('/api/upload', {
            method: 'POST',
            body: fd
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Upload failed');
        }

        const { url } = await res.json();
        return url;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage({ type: '', text: '' });

        try {
            let finalBannerUrl = bannerUrl;
            let finalOgImageUrl = ogImageUrl;
            let oldBannerUrl = '';
            let oldOgImageUrl = '';

            // Upload files if new ones selected
            if (bannerFile) {
                oldBannerUrl = bannerUrl;
                finalBannerUrl = await uploadMedia(bannerFile, 'settings');
                setBannerUrl(finalBannerUrl);
                setBannerFile(null);
            }

            if (ogFile) {
                oldOgImageUrl = ogImageUrl;
                finalOgImageUrl = await uploadMedia(ogFile, 'settings');
                setOgImageUrl(finalOgImageUrl);
                setOgFile(null);
            }

            // Save to database
            const result = await updateServiceSettings(type, {
                banner_url: finalBannerUrl,
                og_image_url: finalOgImageUrl,
                content_markdown: contentMarkdown,
                is_active: isActive
            });

            if (result.success) {
                setMessage({ type: 'success', text: 'Cấu hình đã được lưu thành công' });
                
                // Cleanup orphaned images
                if (oldBannerUrl) {
                    await deleteOldImage(oldBannerUrl);
                }
                if (oldOgImageUrl) {
                    await deleteOldImage(oldOgImageUrl);
                }

                await fetchSettings();
                router.refresh();
            } else {
                setMessage({ type: 'error', text: result.error || 'Cập nhật thất bại.' });
            }
        } catch (error: any) {
            console.error('Failed to update settings', error);
            setMessage({ type: 'error', text: error.message || 'Đã xảy ra lỗi khi lưu cấu hình.' });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64 bg-white shadow rounded-lg">
                <Loader2 className="w-8 h-8 animate-spin text-vinfast-blue" />
            </div>
        );
    }

    return (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-vinfast-blue" />
                    {title || (
                        type === 'booking' ? 'Cấu Hình Đặt Lịch Dịch Vụ' :
                        type === 'care' ? 'Cấu Hình Chăm Sóc Khách Hàng' :
                        'Cấu Hình Quà Tặng VinFast'
                    )}
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Quản lý ảnh banner tiều đề và ảnh đại diện chia sẻ mạng xã hội (Open Graph) cho tính năng {
                        type === 'booking' ? 'Đặt Lịch Dịch Vụ' :
                        type === 'care' ? 'Chăm Sóc Khách Hàng' :
                        'Quà Tặng VinFast'
                    }.
                </p>
            </div>

            {message.text && (
                <div className={`m-6 p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <Info className={`h-5 w-5 ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`} aria-hidden="true" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium">{message.text}</p>
                        </div>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Active Visibility Toggle Flag */}
                <div className="flex items-center gap-3 pb-4 border-b border-gray-150">
                    <input
                        type="checkbox"
                        id="is-active-toggle"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="h-4.5 w-4.5 rounded border-gray-300 text-vinfast-blue focus:ring-vinfast-blue cursor-pointer"
                    />
                    <label htmlFor="is-active-toggle" className="text-sm font-semibold text-gray-750 cursor-pointer select-none">
                        Hiển thị trang này trên Menu Khách hàng
                    </label>
                </div>

                {/* Banner Image */}
                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                        Ảnh nền Banner (Khuyến nghị 1920x600)
                    </label>
                    <div className="flex items-center gap-4">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileChange('banner', e)}
                            className="hidden"
                            id="banner-file-input"
                        />
                        <label
                            htmlFor="banner-file-input"
                            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer shadow-sm"
                        >
                            <ImageIcon className="w-4 h-4 text-gray-550" />
                            Chọn ảnh Banner mới
                        </label>
                        {bannerFile && (
                            <span className="text-xs text-gray-500 font-medium italic">
                                Sẵn sàng tải lên: {bannerFile.name}
                            </span>
                        )}
                    </div>
                    {bannerPreview ? (
                        <div className="relative h-44 w-full bg-gray-50 rounded-xl overflow-hidden border border-gray-200 mt-3 flex items-center justify-center">
                            <Image
                                src={bannerPreview}
                                alt="Banner preview"
                                fill
                                className="object-cover"
                                unoptimized
                            />
                        </div>
                    ) : (
                        <div className="h-44 w-full bg-gray-55 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center mt-3 text-gray-400">
                            <span className="text-sm">Chưa có ảnh Banner</span>
                        </div>
                    )}
                </div>

                {/* Open Graph Image */}
                <div className="space-y-2 pt-6 border-t border-gray-150">
                    <label className="block text-sm font-semibold text-gray-700">
                        Ảnh Thumbnail chia sẻ Zalo/FB (Khuyến nghị 1200x630)
                    </label>
                    <div className="flex items-center gap-4">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileChange('og', e)}
                            className="hidden"
                            id="og-file-input"
                        />
                        <label
                            htmlFor="og-file-input"
                            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer shadow-sm"
                        >
                            <ImageIcon className="w-4 h-4 text-gray-550" />
                            Chọn ảnh Thumbnail mới
                        </label>
                        {ogFile && (
                            <span className="text-xs text-gray-500 font-medium italic">
                                Sẵn sàng tải lên: {ogFile.name}
                            </span>
                        )}
                    </div>
                    {ogPreview ? (
                        <div className="relative h-44 w-full max-w-lg bg-gray-50 rounded-xl overflow-hidden border border-gray-200 mt-3 flex items-center justify-center">
                            <Image
                                src={ogPreview}
                                alt="OG preview"
                                fill
                                className="object-cover"
                                unoptimized
                            />
                        </div>
                    ) : (
                        <div className="h-44 w-full max-w-lg bg-gray-55 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center mt-3 text-gray-400">
                            <span className="text-sm">Chưa có ảnh Thumbnail</span>
                        </div>
                    )}
                </div>

                {/* Content Markdown Section */}
                <div className="mt-6 pt-6 border-t border-gray-150 space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700">
                            Nội dung trang (Markdown)
                        </label>
                        <p className="mt-1 text-xs text-gray-500">
                            Soạn thảo nội dung chính hiển thị trên trang công khai của dịch vụ này.
                        </p>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-2 bg-white space-y-3">
                        <div className="flex border-b border-gray-200">
                            <button
                                type="button"
                                onClick={() => setMarkdownTab('write')}
                                className={`py-2 px-4 border-b-2 font-medium text-sm flex items-center gap-1.5 transition-colors cursor-pointer ${
                                    markdownTab === 'write'
                                        ? 'border-vinfast-blue text-vinfast-blue'
                                        : 'border-transparent text-gray-550 hover:text-gray-805'
                                }`}
                            >
                                <Edit3 className="w-4 h-4" />
                                Soạn thảo
                            </button>
                            <button
                                type="button"
                                onClick={() => setMarkdownTab('preview')}
                                className={`py-2 px-4 border-b-2 font-medium text-sm flex items-center gap-1.5 transition-colors cursor-pointer ${
                                    markdownTab === 'preview'
                                        ? 'border-vinfast-blue text-vinfast-blue'
                                        : 'border-transparent text-gray-550 hover:text-gray-805'
                                }`}
                            >
                                <Eye className="w-4 h-4" />
                                Xem trước
                            </button>
                        </div>

                        {markdownTab === 'write' ? (
                            <div className="mt-1">
                                <textarea
                                    name="content_markdown"
                                    id="content_markdown"
                                    rows={12}
                                    placeholder="Nhập nội dung bằng Markdown..."
                                    value={contentMarkdown}
                                    onChange={(e) => setContentMarkdown(e.target.value)}
                                    className="shadow-sm focus:ring-vinfast-blue focus:border-vinfast-blue block w-full sm:text-sm border-gray-300 rounded-md py-3 px-4 border font-mono leading-relaxed"
                                />
                                <p className="mt-2 text-xs text-gray-500">
                                    Sử dụng cú pháp Markdown (như # Tiêu đề, * Nghiêng, **Đậm**, - Danh sách...) để định dạng.
                                </p>
                            </div>
                        ) : (
                            <div className="border border-gray-200 rounded-md p-6 min-h-[280px] bg-gray-50 max-h-[500px] overflow-y-auto">
                                {contentMarkdown ? (
                                    <div className="prose prose-blue max-w-none text-gray-800 text-sm leading-relaxed prose-headings:font-bold prose-headings:text-gray-900 prose-strong:text-gray-900 font-normal">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {contentMarkdown}
                                        </ReactMarkdown>
                                    </div>
                                ) : (
                                    <p className="text-gray-400 italic text-sm text-center py-12">Chưa có nội dung để hiển thị xem trước.</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Submit button */}
                <div className="pt-5 border-t border-gray-200 flex justify-end">
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="inline-flex items-center justify-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-vinfast-blue hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-vinfast-blue disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                                Đang Lưu...
                            </>
                        ) : (
                            <>
                                <Save className="-ml-1 mr-2 h-4 w-4" />
                                Lưu Thay Đổi
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
