'use client';

import { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { toggleBlogPublishStatus, deleteBlog } from '@/app/actions/blogs';
import { Pencil, Trash2, Plus, AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Search, FileText } from 'lucide-react';

const ITEMS_PER_PAGE = 8;

type BlogPost = {
    id: string;
    title: string;
    slug: string;
    category: string;
    is_published: boolean;
    created_at: string;
};

export default function AdminBlogsPage() {
    const [items, setItems] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [searchInput, setSearchInput] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    
    const [deletingBlog, setDeletingBlog] = useState<BlogPost | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [togglingId, setTogglingId] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        const t = setTimeout(() => { 
            setDebouncedSearch(searchInput); 
            setCurrentPage(1); 
        }, 500);
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

    const fetchItems = async () => {
        setLoading(true);
        try {
            const start = (currentPage - 1) * ITEMS_PER_PAGE;
            const end = start + ITEMS_PER_PAGE - 1;
            
            let query = supabase
                .from('blogs')
                .select('id, title, slug, category, is_published, created_at', { count: 'exact' })
                .order('created_at', { ascending: false })
                .range(start, end);
                
            if (debouncedSearch) {
                query = query.or(`title.ilike.%${debouncedSearch}%,slug.ilike.%${debouncedSearch}%`);
            }
            
            const { data, count, error } = await query;
            if (error) throw error;
            
            setItems((data as unknown as BlogPost[]) || []);
            setTotalItems(count || 0);
        } catch (err) {
            console.error(err);
            notify('error', 'Lỗi khi tải danh sách bài viết');
        } finally {
            setLoading(false);
        }
    };

    const handleTogglePublish = async (id: string, currentStatus: boolean) => {
        setTogglingId(id);
        const newStatus = !currentStatus;
        
        // Optimistic UI update
        setItems(prev => prev.map(item => item.id === id ? { ...item, is_published: newStatus } : item));
        
        try {
            const result = await toggleBlogPublishStatus(id, newStatus);
            if (!result.success) throw new Error(result.error);
            
            notify('success', `Đã ${newStatus ? 'xuất bản' : 'tạm ẩn'} bài viết`);
            fetchItems();
        } catch (err) {
            fetchItems();
            console.error(err);
            notify('error', 'Lỗi khi cập nhật trạng thái hiển thị');
        } finally {
            setTogglingId(null);
        }
    };

    const handleDelete = async () => {
        if (!deletingBlog) return;
        setIsDeleting(true);
        try {
            const result = await deleteBlog(deletingBlog.id);
            if (!result.success) throw new Error(result.error);
            
            notify('success', 'Đã xóa bài viết thành công');
            setDeletingBlog(null);
            
            if (items.length === 1 && currentPage > 1) {
                setCurrentPage(p => p - 1);
            } else {
                fetchItems();
            }
        } catch (err) {
            console.error(err);
            notify('error', 'Lỗi khi xóa bài viết');
        } finally {
            setIsDeleting(false);
        }
    };

    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

    return (
        <div className="space-y-6 relative">
            {/* Notification Toast */}
            {notification && (
                <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded shadow-lg flex items-center gap-2 text-white animate-fade-in-down ${notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
                    {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <span>{notification.message}</span>
                </div>
            )}

            {/* Header / Search Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 font-display">Quản lý Tin Tức & Sự Kiện</h2>
                    <p className="text-sm text-gray-500 mt-1">Danh sách tin tức, sự kiện và cẩm nang hướng dẫn sử dụng xe VinFast</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Tìm bài viết theo tiêu đề..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-vinfast-blue/50 focus:border-vinfast-blue transition-all text-sm bg-white text-gray-800"
                        />
                    </div>
                    <Link
                        href="/admin/blogs/create"
                        className="flex items-center gap-2 px-4 py-2 bg-vinfast-blue text-white rounded hover:bg-blue-800 transition-colors text-sm font-medium shadow-sm shrink-0"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Thêm Mới</span>
                    </Link>
                </div>
            </div>

            {/* Table Card */}
            <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                {loading ? (
                    <div className="p-12 text-center text-gray-500 flex flex-col items-center space-y-3">
                        <div className="w-8 h-8 border-4 border-vinfast-blue border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-sm font-medium">Đang tải danh sách bài viết...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse whitespace-nowrap min-w-[800px]">
                            <thead>
                                <tr className="bg-gray-50 text-gray-600 text-sm uppercase tracking-wider">
                                    <th className="px-6 py-4 font-semibold border-b">Tiêu đề bài viết</th>
                                    <th className="px-6 py-4 font-semibold border-b w-48">Chuyên mục</th>
                                    <th className="px-6 py-4 font-semibold border-b w-32">Hiển thị</th>
                                    <th className="px-6 py-4 font-semibold border-b w-48">Ngày đăng</th>
                                    <th className="px-6 py-4 font-semibold border-b text-right w-32">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 text-sm text-gray-700">
                                {items.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-16 text-center text-gray-500">
                                            <div className="flex flex-col items-center">
                                                <FileText className="w-12 h-12 text-gray-300 mb-4" />
                                                <p className="text-lg font-medium text-gray-700 mb-1">
                                                    {debouncedSearch ? 'Không tìm thấy bài viết' : 'Chưa có bài viết nào'}
                                                </p>
                                                <p className="text-sm text-gray-400">
                                                    {debouncedSearch ? 'Thử tìm kiếm với tiêu đề khác' : 'Nhấp vào nút Thêm Mới để bắt đầu'}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    items.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                                            <td className="px-6 py-4 max-w-md">
                                                <div className="font-bold text-gray-900 truncate" title={item.title}>
                                                    {item.title}
                                                </div>
                                                <div className="text-xs text-gray-400 font-mono mt-0.5">
                                                    /{item.slug}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2.5 py-1 text-xs font-semibold rounded bg-blue-50 text-[#00358E] border border-blue-100">
                                                    {item.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <label className="relative inline-flex items-center cursor-pointer select-none">
                                                        <input
                                                            type="checkbox"
                                                            className="sr-only peer"
                                                            checked={item.is_published}
                                                            disabled={togglingId === item.id}
                                                            onChange={() => handleTogglePublish(item.id, item.is_published)}
                                                        />
                                                        <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-vinfast-blue ${togglingId === item.id ? 'opacity-55 cursor-not-allowed' : ''}`}></div>
                                                        <span className="ml-3 text-xs font-semibold text-gray-600 w-16">
                                                            {item.is_published ? 'Xuất bản' : 'Tạm ẩn'}
                                                        </span>
                                                    </label>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-gray-500">
                                                {new Date(item.created_at).toLocaleString('vi-VN', {
                                                    year: 'numeric',
                                                    month: '2-digit',
                                                    day: '2-digit',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        href={`/admin/blogs/${item.id}`}
                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                        title="Sửa bài viết"
                                                    >
                                                        <Pencil className="w-4.5 h-4.5" />
                                                    </Link>
                                                    <button
                                                        onClick={() => setDeletingBlog(item)}
                                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                                                        title="Xóa bài viết"
                                                    >
                                                        <Trash2 className="w-4.5 h-4.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination Controls */}
                {!loading && totalItems > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50 gap-4">
                        <div className="text-sm text-gray-600 text-center sm:text-left">
                            Hiển thị từ <span className="font-semibold text-gray-900">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> đến <span className="font-semibold text-gray-900">{Math.min(currentPage * ITEMS_PER_PAGE, totalItems)}</span> trong tổng số <span className="font-semibold text-gray-900">{totalItems}</span> bài viết
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-sm font-semibold text-gray-700 px-3 bg-white py-1.5 border border-gray-300 rounded shadow-sm">
                                Trang {currentPage} / {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Custom Delete Confirmation Modal */}
            {deletingBlog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 transform transition-all scale-100 animate-scale-up">
                        <div className="p-6">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-red-100 text-red-600 rounded-full shrink-0">
                                    <AlertCircle className="w-6 h-6" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-lg font-bold text-gray-900">
                                        Xác nhận xóa bài viết?
                                    </h3>
                                    <p className="text-sm text-gray-500 leading-relaxed">
                                        Bạn có chắc chắn muốn xóa bài viết <span className="font-bold text-gray-800">&ldquo;{deletingBlog.title}&rdquo;</span>? Hành động này sẽ loại bỏ bài viết vĩnh viễn và không thể khôi phục.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setDeletingBlog(null)}
                                disabled={isDeleting}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors text-sm font-medium bg-white disabled:opacity-50"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50 flex items-center gap-2 shadow-sm cursor-pointer"
                            >
                                {isDeleting && (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                )}
                                Xác nhận xóa
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
