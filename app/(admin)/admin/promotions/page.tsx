'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { Pencil, Trash2, X, Plus, AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import dynamic from 'next/dynamic';

const RichTextEditor = dynamic(() => import('@/components/admin/RichTextEditor'), { ssr: false });

const ITEMS_PER_PAGE = 8;

type MediaObj = { id?: string; url: string; filename?: string } | null;

type Promotion = {
    id: string;
    title: string;
    slug: string;
    description?: string;
    banner_url?: string | null;
    mobile_url?: string | null;
    start_date?: string;
    end_date?: string;
    is_active: boolean;
};

type FormState = {
    title: string;
    slug: string;
    description: string;
    start_date: string;
    end_date: string;
    is_active: boolean;
};

export default function AdminPromotionsPage() {
    const [items, setItems] = useState<Promotion[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [searchInput, setSearchInput] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editing, setEditing] = useState<Promotion | null>(null);
    const [form, setForm] = useState<FormState>({
        title: '', slug: '', description: '',
        start_date: '', end_date: '', is_active: true
    });
    const [saving, setSaving] = useState(false);
    const [desktopFile, setDesktopFile] = useState<File | null>(null);
    const [mobileFile, setMobileFile] = useState<File | null>(null);
    const [desktopPreview, setDesktopPreview] = useState<string | null>(null);
    const [mobilePreview, setMobilePreview] = useState<string | null>(null);
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Storage cleanup state
    const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);

    const queueImageForDeletion = (url: string | null) => {
        if (!url) return;

        // Tìm vị trí chữ 'images/' trong link
        const searchString = 'supabase.co/storage/v1/object/public/images/';

        if (url.includes(searchString)) {
            // Cắt bỏ phần đầu, chỉ lấy tên thư mục và tên file (VD: promotions/anh.jpg)
            const filePath = url.split(searchString)[1];

            // Giải mã ký tự đặc biệt (nếu có khoảng trắng)
            const decodedPath = decodeURIComponent(filePath);

            setImagesToDelete(prev => {
                if (!prev.includes(decodedPath)) {
                    return [...prev, decodedPath];
                }
                return prev;
            });
        }
    };
    useEffect(() => {
        const t = setTimeout(() => { setDebouncedSearch(searchInput); setCurrentPage(1); }, 500);
        return () => clearTimeout(t);
    }, [searchInput]);

    useEffect(() => {
        fetchItems();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, debouncedSearch]);

    const notify = (type: 'success' | 'error', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 3000);
    };

    const generateSlug = (text: string) =>
        text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-')
            .replace(/^-+/, '').replace(/-+$/, '');

    const fetchItems = async () => {
        setLoading(true);
        try {
            const start = (currentPage - 1) * ITEMS_PER_PAGE;
            const end = start + ITEMS_PER_PAGE - 1;
            let query = supabase
                .from('promotions')
                .select('*', { count: 'exact' })
                .order('created_at', { ascending: false })
                .range(start, end);
            if (debouncedSearch) {
                query = query.or(`title.ilike.%${debouncedSearch}%,slug.ilike.%${debouncedSearch}%`);
            }
            const { data, count, error } = await query;
            if (error) throw error;
            setItems((data as unknown as Promotion[]) || []);
            setTotalItems(count || 0);
        } catch (err) {
            console.error(err);
            notify('error', 'Lỗi khi tải danh sách khuyến mãi');
        } finally {
            setLoading(false);
        }
    };

    const uploadMedia = async (file: File, folder: string): Promise<string> => {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('folder', folder);
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Upload failed');
        }
        const { url } = await res.json();
        return url;
    };

    const openModal = (promo?: Promotion) => {
        setDesktopFile(null); setMobileFile(null);
        setDesktopPreview(null); setMobilePreview(null);
        if (promo) {
            setEditing(promo);
            setForm({
                title: promo.title || '',
                slug: promo.slug || '',
                description: promo.description || '',
                start_date: promo.start_date ? promo.start_date.substring(0, 10) : '',
                end_date: promo.end_date ? promo.end_date.substring(0, 10) : '',
                is_active: promo.is_active ?? true,
            });
            if (promo.banner_url) setDesktopPreview(promo.banner_url);
            if (promo.mobile_url) setMobilePreview(promo.mobile_url);
        } else {
            setEditing(null);
            setForm({ title: '', slug: '', description: '', start_date: '', end_date: '', is_active: true });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false); setEditing(null);
        setDesktopFile(null); setMobileFile(null);
        if (desktopPreview?.startsWith('blob:')) URL.revokeObjectURL(desktopPreview);
        if (mobilePreview?.startsWith('blob:')) URL.revokeObjectURL(mobilePreview);
        setDesktopPreview(null); setMobilePreview(null);
        setImagesToDelete([]);
    };

    const handleFileChange = (type: 'desktop' | 'mobile', e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const url = URL.createObjectURL(file);

        // Đã đổi editingItem thành editing và chia 2 trường hợp desktop/mobile
        if (type === 'desktop' && editing?.banner_url) {
            queueImageForDeletion(editing.banner_url);
        } else if (type === 'mobile' && editing?.mobile_url) {
            queueImageForDeletion(editing.mobile_url);
        }

        if (type === 'desktop') {
            setDesktopFile(file);
            setDesktopPreview(url);
        }
        else {
            setMobileFile(file);
            setMobilePreview(url);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            let bannerUrl = editing?.banner_url || null;
            let mobileUrl = editing?.mobile_url || null;

            if (desktopFile) {
                if (editing?.banner_url) {
                    queueImageForDeletion(editing.banner_url);
                }
                bannerUrl = await uploadMedia(desktopFile, 'promotions');
            }
            if (mobileFile) {
                if (editing?.mobile_url) {
                    queueImageForDeletion(editing.mobile_url);
                }
                mobileUrl = await uploadMedia(mobileFile, 'promotions');
            }

            const payload: Record<string, unknown> = {
                title: form.title,
                slug: form.slug,
                description: form.description,
                start_date: form.start_date || null,
                end_date: form.end_date || null,
                is_active: form.is_active,
                banner_url: bannerUrl,
                mobile_url: mobileUrl,
            };

            if (editing?.id) {
                payload.id = editing.id;
            }

            const { error } = await supabase
                .from('promotions')
                .upsert(payload, { onConflict: 'id' });

            if (error) throw error;

            // Delete queued images from Supabase storage
            if (imagesToDelete.length > 0) {
                const { error: removeError } = await supabase.storage.from('images').remove(imagesToDelete);
                if (removeError) {
                    console.error("Failed to delete old images:", removeError);
                }
                setImagesToDelete([]);
            }

            fetchItems();
            closeModal();
            notify('success', 'Đã lưu khuyến mãi thành công');
        } catch (err) {
            const e = err as Error;
            console.error(e);
            notify('error', `Lỗi: ${e.message}`);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Xóa khuyến mãi này?')) return;
        try {
            const { error } = await supabase.from('promotions').delete().eq('id', id);
            if (error) throw error;
            notify('success', 'Đã xóa');
            fetchItems();
        } catch (err) {
            notify('error', `Lỗi xóa: ${(err as Error).message}`);
        }
    };

    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

    return (
        <div className="space-y-6 relative">
            {/* Notification */}
            {notification && (
                <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded shadow-lg flex items-center gap-2 text-white animate-fade-in-down ${notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
                    {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <span>{notification.message}</span>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-800">Quản lý Khuyến Mãi</h2>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Tìm kiếm..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-vinfast-blue/50 focus:border-vinfast-blue transition-all text-sm"
                        />
                    </div>
                    <button
                        onClick={() => openModal()}
                        className="flex items-center gap-2 px-4 py-2 bg-vinfast-blue text-white rounded hover:bg-blue-800 transition-colors text-sm font-medium shadow-sm shrink-0"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Thêm Mới</span>
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                {loading ? (
                    <div className="p-12 text-center text-gray-500 flex flex-col items-center space-y-3">
                        <div className="w-8 h-8 border-4 border-vinfast-blue border-t-transparent rounded-full animate-spin"></div>
                        <p>Đang tải...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse whitespace-nowrap min-w-[800px]">
                            <thead>
                                <tr className="bg-gray-50 text-gray-600 text-sm uppercase tracking-wider">
                                    <th className="px-6 py-4 font-semibold border-b w-24">Banner</th>
                                    <th className="px-6 py-4 font-semibold border-b">Tiêu đề</th>
                                    <th className="px-6 py-4 font-semibold border-b">Trạng thái</th>
                                    <th className="px-6 py-4 font-semibold border-b">Thời gian</th>
                                    <th className="px-6 py-4 font-semibold border-b text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 text-sm text-gray-700">
                                {items.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-16 text-center text-gray-500">
                                            <div className="flex flex-col items-center">
                                                <Search className="w-12 h-12 text-gray-300 mb-4" />
                                                <p className="text-lg font-medium text-gray-700 mb-1">
                                                    {debouncedSearch ? 'Không tìm thấy' : 'Chưa có khuyến mãi nào'}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    items.map((item) => {
                                        const thumbUrl = item.banner_url || '/images/placeholder.webp';
                                        return (
                                            <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-3">
                                                    <div className="relative h-14 w-20 bg-gray-100 rounded-md overflow-hidden border border-gray-200 shadow-sm">
                                                        <Image src={thumbUrl} alt={item.title} fill className="object-cover" unoptimized
                                                            onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholder.webp'; }} />
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-gray-900">{item.title}</div>
                                                    <div className="text-gray-500 text-xs mt-1">/{item.slug}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-0.5 text-[10px] uppercase font-bold tracking-wide rounded-full ${item.is_active ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                                                        {item.is_active ? 'Đang chạy' : 'Tắt'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-xs">
                                                    {item.start_date ? new Date(item.start_date).toLocaleDateString('vi-VN') : '—'} → {item.end_date ? new Date(item.end_date).toLocaleDateString('vi-VN') : '—'}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-3">
                                                        <button onClick={() => openModal(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Sửa">
                                                            <Pencil className="w-5 h-5" />
                                                        </button>
                                                        <button onClick={() => handleDelete(item.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors" title="Xóa">
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {!loading && totalItems > 0 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
                        <div className="text-sm text-gray-600">
                            Hiển thị <span className="font-semibold text-gray-900">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> đến <span className="font-semibold text-gray-900">{Math.min(currentPage * ITEMS_PER_PAGE, totalItems)}</span> trong số <span className="font-semibold text-gray-900">{totalItems}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                                className="p-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-sm font-medium text-gray-700 px-2">Trang {currentPage} / {totalPages}</span>
                            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                                className="p-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-xl font-bold text-gray-800">
                                {editing ? 'Chỉnh sửa Khuyến Mãi' : 'Thêm Khuyến Mãi Mới'}
                            </h3>
                            <button onClick={closeModal} className="p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                            <form id="promo-form" onSubmit={handleSave} className="space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700">Tiêu đề <span className="text-red-500">*</span></label>
                                        <input required type="text" value={form.title}
                                            onChange={e => {
                                                const t = e.target.value;
                                                setForm(f => ({
                                                    ...f, title: t,
                                                    slug: !editing || f.slug === generateSlug(f.title) ? generateSlug(t) : f.slug
                                                }));
                                            }}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-vinfast-blue/50 focus:border-vinfast-blue transition-all"
                                            placeholder="VD: Giảm 5 triệu tháng 5" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700">Slug <span className="text-red-500">*</span></label>
                                        <input required type="text" value={form.slug}
                                            onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-vinfast-blue/50 focus:border-vinfast-blue transition-all"
                                            placeholder="giam-5-trieu-thang-5" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700">Ngày bắt đầu <span className="text-red-500">*</span></label>
                                        <input required type="date" value={form.start_date}
                                            onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-vinfast-blue/50 focus:border-vinfast-blue transition-all" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700">Ngày kết thúc <span className="text-red-500">*</span></label>
                                        <input required type="date" value={form.end_date}
                                            onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-vinfast-blue/50 focus:border-vinfast-blue transition-all" />
                                    </div>
                                </div>

                                {/* Toggle is_active */}
                                <div className="flex items-center pt-2">
                                    <label className="flex items-center gap-3 cursor-pointer group w-fit">
                                        <div className="relative">
                                            <input type="checkbox" className="sr-only" checked={form.is_active}
                                                onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
                                            <div className={`block w-11 h-6 rounded-full transition-colors ${form.is_active ? 'bg-vinfast-blue' : 'bg-gray-300'}`}></div>
                                            <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${form.is_active ? 'translate-x-5' : ''}`}></div>
                                        </div>
                                        <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Đang hoạt động</span>
                                    </label>
                                </div>

                                {/* Desktop Image */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-gray-700">Ảnh Desktop (Banner ngang) <span className="text-red-500">*</span></label>
                                    <input type="file" accept="image/*" onChange={(e) => handleFileChange('desktop', e)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:bg-vinfast-blue file:text-white file:text-sm file:cursor-pointer" />
                                    {desktopPreview && (
                                        <div className="relative h-40 w-full bg-gray-100 rounded-md overflow-hidden border border-gray-200 mt-2">
                                            <Image src={desktopPreview} alt="Desktop preview" fill className="object-contain" unoptimized />
                                        </div>
                                    )}
                                </div>

                                {/* Mobile Image */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-gray-700">Ảnh Mobile (Banner dọc)</label>
                                    <input type="file" accept="image/*" onChange={(e) => handleFileChange('mobile', e)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:bg-vinfast-blue file:text-white file:text-sm file:cursor-pointer" />
                                    {mobilePreview && (
                                        <div className="relative h-40 w-full bg-gray-100 rounded-md overflow-hidden border border-gray-200 mt-2">
                                            <Image src={mobilePreview} alt="Mobile preview" fill className="object-contain" unoptimized />
                                        </div>
                                    )}
                                    <p className="text-xs text-gray-400">Nếu bỏ trống, ảnh Desktop sẽ được dùng trên mobile.</p>
                                </div>

                                {/* Description */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-gray-700">Mô tả chi tiết</label>
                                    <RichTextEditor
                                        value={form.description}
                                        onChange={(val: string) => setForm(f => ({ ...f, description: val }))}
                                    />
                                </div>
                            </form>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
                            <button type="button" onClick={closeModal}
                                className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors text-sm font-medium">
                                Hủy
                            </button>
                            <button type="submit" form="promo-form" disabled={saving}
                                className="px-5 py-2.5 bg-vinfast-blue text-white rounded-lg hover:bg-blue-800 transition-colors text-sm font-medium disabled:opacity-50 flex items-center gap-2">
                                {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                                {editing ? 'Cập Nhật' : 'Tạo Mới'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
