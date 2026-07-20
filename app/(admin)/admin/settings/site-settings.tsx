'use client';

import { useState, useEffect } from 'react';
import { Save, Loader2, Info, Globe, Eye, Edit3 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function SiteSettings() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [markdownTab, setMarkdownTab] = useState<'write' | 'preview'>('write');

    const [formData, setFormData] = useState({
        phone: '',
        email: '',
        address: '',
        google_maps_link: '',
        link_xe_may_dien: '',
        link_gf_xanh_mekong: '',
        link_share_vi_tri: '',
        zalo_link: '',
        facebook_link: '',
        tiktok_link: '',
        privacy_policy_markdown: ''
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('site_settings')
                .select('*')
                .single();

            if (error) {
                console.error('Error fetching settings:', error);
                setMessage({ type: 'error', text: 'Không thể tải cấu hình hiện tại.' });
                return;
            }

            if (data) {
                setFormData({
                    phone: data.phone || '',
                    email: data.email || '',
                    address: data.address || '',
                    google_maps_link: data.google_maps_link || '',
                    link_xe_may_dien: data.link_xe_may_dien || '',
                    link_gf_xanh_mekong: data.link_gf_xanh_mekong || '',
                    link_share_vi_tri: data.link_share_vi_tri || '',
                    zalo_link: data.zalo_link || '',
                    facebook_link: data.facebook_link || '',
                    tiktok_link: data.tiktok_link || '',
                    privacy_policy_markdown: data.privacy_policy_markdown || ''
                });
            }
        } catch (error) {
            console.error('Failed to fetch settings', error);
            setMessage({ type: 'error', text: 'Đã xảy ra lỗi khi tải cấu hình.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage({ type: '', text: '' });

        try {
            // URL Cleaner: Extract `src` if iframe tag is present, otherwise use raw
            let rawMapUrl = formData.google_maps_link?.trim();
            let cleanMapUrl = rawMapUrl;

            if (rawMapUrl && rawMapUrl.includes('<iframe')) {
                const srcMatch = rawMapUrl.match(/src="([^"]+)"/);
                if (srcMatch && srcMatch[1]) {
                    cleanMapUrl = srcMatch[1];
                } else {
                    cleanMapUrl = ''; // fallback to empty if parse fails
                }
            }

            // Re-update the state locally so the user sees the cleaned URL
            setFormData(prev => ({ ...prev, google_maps_link: cleanMapUrl }));

            const { data: sessionData } = await supabase.auth.getSession();
            const token = sessionData.session?.access_token;

            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const payloadToSave = { ...formData, google_maps_link: cleanMapUrl };

            const res = await fetch('/api/admin/settings', {
                method: 'PATCH',
                headers,
                body: JSON.stringify(payloadToSave),
            });

            if (res.ok) {
                setMessage({ type: 'success', text: 'Đã cập nhật cấu hình website thành công' });
                await fetchSettings(); // Automatically reload the newest data into the form
                router.refresh(); // Refresh the current route and its server components
            } else {
                const data = await res.json();
                setMessage({ type: 'error', text: data.error || 'Cập nhật thất bại.' });
            }
        } catch (error) {
            console.error('Failed to update settings', error);
            setMessage({ type: 'error', text: 'Đã xảy ra lỗi khi lưu cấu hình.' });
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
                    <Globe className="w-5 h-5 text-vinfast-blue" />
                    Thông Tin Website
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Quản lý các thông tin liên hệ như điện thoại, email, địa chỉ hiển thị trên toàn bộ website.
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
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                    <div className="sm:col-span-1">
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                            Số Điện Thoại (Hotline/Zalo)
                        </label>
                        <div className="mt-1">
                            <input
                                type="text"
                                name="phone"
                                id="phone"
                                placeholder="VD: 0946 156 156"
                                value={formData.phone}
                                onChange={handleChange}
                                className="shadow-sm focus:ring-vinfast-blue focus:border-vinfast-blue block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-1">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Email
                        </label>
                        <div className="mt-1">
                            <input
                                type="email"
                                name="email"
                                id="email"
                                placeholder="VD: vinfastmekong@gmail.com"
                                value={formData.email}
                                onChange={handleChange}
                                className="shadow-sm focus:ring-vinfast-blue focus:border-vinfast-blue block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-2">
                        <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                            Địa Chỉ Showroom
                        </label>
                        <div className="mt-1">
                            <input
                                type="text"
                                name="address"
                                id="address"
                                placeholder="VD: Số 10362, đường Võ Nguyên Giáp..."
                                value={formData.address}
                                onChange={handleChange}
                                className="shadow-sm focus:ring-vinfast-blue focus:border-vinfast-blue block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-2">
                        <label htmlFor="google_maps_link" className="block text-sm font-medium text-gray-700">
                            Google Maps Iframe Link `src`
                        </label>
                        <div className="mt-1">
                            <textarea
                                name="google_maps_link"
                                id="google_maps_link"
                                rows={3}
                                placeholder="https://www.google.com/maps/embed?pb=..."
                                value={formData.google_maps_link}
                                onChange={handleChange}
                                className="shadow-sm focus:ring-vinfast-blue focus:border-vinfast-blue block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                            />
                        </div>
                        <p className="mt-2 text-sm text-gray-500">
                            Bạn có thể dán link trực tiếp hoặc dán toàn bộ đoạn mã Nhúng (Iframe) từ Google Maps, hệ thống sẽ tự xử lý cho bạn.
                        </p>
                    </div>
                </div>

                {/* 6 New Configuration Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-200">
                    <div className="sm:col-span-1">
                        <label htmlFor="link_xe_may_dien" className="block text-sm font-medium text-gray-700">
                            Link ôtô điện
                        </label>
                        <div className="mt-1">
                            <input
                                type="text"
                                name="link_xe_may_dien"
                                id="link_xe_may_dien"
                                placeholder="VD: https://vinfastmekong.vn"
                                value={formData.link_xe_may_dien}
                                onChange={handleChange}
                                className="shadow-sm focus:ring-vinfast-blue focus:border-vinfast-blue block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-1">
                        <label htmlFor="link_gf_xanh_mekong" className="block text-sm font-medium text-gray-700">
                            Link GF Xanh Mekong
                        </label>
                        <div className="mt-1">
                            <input
                                type="text"
                                name="link_gf_xanh_mekong"
                                id="link_gf_xanh_mekong"
                                placeholder="VD: https://gf.vinfastmekong.vn"
                                value={formData.link_gf_xanh_mekong}
                                onChange={handleChange}
                                className="shadow-sm focus:ring-vinfast-blue focus:border-vinfast-blue block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-1">
                        <label htmlFor="link_share_vi_tri" className="block text-sm font-medium text-gray-700">
                            Link Share Vị trí Showroom
                        </label>
                        <div className="mt-1">
                            <input
                                type="text"
                                name="link_share_vi_tri"
                                id="link_share_vi_tri"
                                placeholder="VD: https://maps.app.goo.gl/..."
                                value={formData.link_share_vi_tri}
                                onChange={handleChange}
                                className="shadow-sm focus:ring-vinfast-blue focus:border-vinfast-blue block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-1">
                        <label htmlFor="zalo_link" className="block text-sm font-medium text-gray-700">
                            SĐT Zalo
                        </label>
                        <div className="mt-1">
                            <input
                                type="text"
                                name="zalo_link"
                                id="zalo_link"
                                placeholder="VD: 0946156156"
                                value={formData.zalo_link}
                                onChange={handleChange}
                                className="shadow-sm focus:ring-vinfast-blue focus:border-vinfast-blue block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-1">
                        <label htmlFor="facebook_link" className="block text-sm font-medium text-gray-700">
                            Link Fanpage
                        </label>
                        <div className="mt-1">
                            <input
                                type="text"
                                name="facebook_link"
                                id="facebook_link"
                                placeholder="VD: https://facebook.com/..."
                                value={formData.facebook_link}
                                onChange={handleChange}
                                className="shadow-sm focus:ring-vinfast-blue focus:border-vinfast-blue block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-1">
                        <label htmlFor="tiktok_link" className="block text-sm font-medium text-gray-700">
                            Link TikTok
                        </label>
                        <div className="mt-1">
                            <input
                                type="text"
                                name="tiktok_link"
                                id="tiktok_link"
                                placeholder="VD: https://tiktok.com/@..."
                                value={formData.tiktok_link}
                                onChange={handleChange}
                                className="shadow-sm focus:ring-vinfast-blue focus:border-vinfast-blue block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                            />
                        </div>
                    </div>
                </div>

                {/* Privacy Policy Markdown Section */}
                <div className="mt-6 pt-6 border-t border-gray-200 space-y-4">
                    <div>
                        <label className="block text-base font-medium text-gray-900">
                            Nội dung Chính sách bảo mật (Markdown)
                        </label>
                        <p className="mt-1 text-sm text-gray-500">
                            Soạn thảo chính sách bảo mật của website hiển thị trên trang công khai.
                        </p>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-2 bg-white space-y-3">
                        <div className="flex border-b border-gray-200">
                            <button
                                type="button"
                                onClick={() => setMarkdownTab('write')}
                                className={`py-2.5 px-4 border-b-2 font-medium text-sm flex items-center gap-1.5 transition-colors cursor-pointer ${markdownTab === 'write'
                                        ? 'border-vinfast-blue text-vinfast-blue'
                                        : 'border-transparent text-gray-550 hover:text-gray-800'
                                    }`}
                            >
                                <Edit3 className="w-4 h-4" />
                                Soạn thảo
                            </button>
                            <button
                                type="button"
                                onClick={() => setMarkdownTab('preview')}
                                className={`py-2.5 px-4 border-b-2 font-medium text-sm flex items-center gap-1.5 transition-colors cursor-pointer ${markdownTab === 'preview'
                                        ? 'border-vinfast-blue text-vinfast-blue'
                                        : 'border-transparent text-gray-550 hover:text-gray-800'
                                    }`}
                            >
                                <Eye className="w-4 h-4" />
                                Xem trước
                            </button>
                        </div>

                        {markdownTab === 'write' ? (
                            <div className="mt-1">
                                <textarea
                                    name="privacy_policy_markdown"
                                    id="privacy_policy_markdown"
                                    rows={12}
                                    placeholder="Nhập nội dung chính sách bảo mật bằng Markdown..."
                                    value={formData.privacy_policy_markdown}
                                    onChange={handleChange}
                                    className="shadow-sm focus:ring-vinfast-blue focus:border-vinfast-blue block w-full sm:text-sm border-gray-300 rounded-md py-3 px-4 border font-mono leading-relaxed"
                                />
                                <p className="mt-2 text-xs text-gray-500">
                                    Sử dụng cú pháp Markdown (như # Tiêu đề, * Nghiêng, **Đậm**, - Danh sách...) để định dạng.
                                </p>
                            </div>
                        ) : (
                            <div className="border border-gray-200 rounded-md p-6 min-h-[280px] bg-gray-50 max-h-[500px] overflow-y-auto">
                                {formData.privacy_policy_markdown ? (
                                    <div className="prose prose-blue max-w-none text-gray-800 text-sm leading-relaxed prose-headings:font-bold prose-headings:text-gray-900 prose-strong:text-gray-900">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {formData.privacy_policy_markdown}
                                        </ReactMarkdown>
                                    </div>
                                ) : (
                                    <p className="text-gray-400 italic text-sm text-center py-12">Chưa có nội dung để hiển thị xem trước.</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="pt-5 border-t border-gray-200 flex justify-end">
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-vinfast-blue hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-vinfast-blue disabled:opacity-50 disabled:cursor-not-allowed"
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
