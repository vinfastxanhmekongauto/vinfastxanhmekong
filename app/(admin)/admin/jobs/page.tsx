'use client';

import { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { toggleJobActiveStatus, duplicateJob } from '@/app/actions/jobs';
import { Pencil, Trash2, Plus, AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Search, Briefcase, Copy } from 'lucide-react';

const ITEMS_PER_PAGE = 8;

type Position = {
    role: string;
    quantity: string;
    qualification: string;
    location: string;
    description: string;
    requirements: string;
};

type Job = {
    id: string;
    positions?: Position[];
    is_active: boolean;
    created_at: string;
};

export default function AdminJobsPage() {
    const [items, setItems] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [searchInput, setSearchInput] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    
    // Modal & Action states
    const [deletingJob, setDeletingJob] = useState<Job | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [togglingId, setTogglingId] = useState<string | null>(null);
    const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const handleDuplicate = async (id: string) => {
        if (isPending || duplicatingId) return;
        setDuplicatingId(id);
        startTransition(async () => {
            try {
                const result = await duplicateJob(id);
                if (!result.success) throw new Error(result.error);
                
                notify('success', 'Nhân bản tin tuyển dụng thành công');
                fetchItems();
            } catch (err) {
                console.error(err);
                notify('error', 'Lỗi khi nhân bản tin tuyển dụng');
            } finally {
                setDuplicatingId(null);
            }
        });
    };

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
            let query = supabase
                .from('jobs')
                .select('id, is_active, created_at, positions')
                .order('created_at', { ascending: false });
                
            const { data, error } = await query;
            if (error) throw error;
            
            let filteredJobs = (data as unknown as Job[]) || [];
            if (debouncedSearch) {
                const lowerSearch = debouncedSearch.toLowerCase();
                filteredJobs = filteredJobs.filter(job => {
                    const roles = job.positions?.map(p => p.role.toLowerCase()) || [];
                    return roles.some(role => role.includes(lowerSearch)) || job.id.toLowerCase().includes(lowerSearch);
                });
            }
            
            const total = filteredJobs.length;
            const start = (currentPage - 1) * ITEMS_PER_PAGE;
            const end = start + ITEMS_PER_PAGE;
            setItems(filteredJobs.slice(start, end));
            setTotalItems(total);
        } catch (err) {
            console.error(err);
            notify('error', 'Lỗi khi tải danh sách tin tuyển dụng');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleActive = async (id: string, currentStatus: boolean) => {
        setTogglingId(id);
        const newStatus = !currentStatus;
        
        // Optimistic UI update: if turning active, deactivate all other jobs optimistically
        setItems(prev => prev.map(item => item.id === id ? { ...item, is_active: newStatus } : (newStatus ? { ...item, is_active: false } : item)));
        
        try {
            const result = await toggleJobActiveStatus(id, newStatus);
            if (!result.success) throw new Error(result.error);
            
            notify('success', `Đã ${newStatus ? 'bật' : 'tắt'} trạng thái tuyển dụng`);
            fetchItems();
        } catch (err) {
            fetchItems();
            console.error(err);
            notify('error', 'Lỗi khi cập nhật trạng thái tuyển dụng');
        } finally {
            setTogglingId(null);
        }
    };

    const handleDelete = async () => {
        if (!deletingJob) return;
        setIsDeleting(true);
        try {
            const { error } = await supabase
                .from('jobs')
                .delete()
                .eq('id', deletingJob.id);
                
            if (error) throw error;
            notify('success', 'Đã xóa tin tuyển dụng thành công');
            setDeletingJob(null);
            
            // Adjust current page if the deleted item was the only item on the last page
            if (items.length === 1 && currentPage > 1) {
                setCurrentPage(p => p - 1);
            } else {
                fetchItems();
            }
        } catch (err) {
            console.error(err);
            notify('error', 'Lỗi khi xóa tin tuyển dụng');
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
                    <h2 className="text-2xl font-bold text-gray-800">Quản lý Tuyển Dụng</h2>
                    <p className="text-sm text-gray-500 mt-1">Danh sách tin tuyển dụng và cơ hội nghề nghiệp tại VinFast Xanh Mekong</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo tiêu đề, slug..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-vinfast-blue/50 focus:border-vinfast-blue transition-all text-sm bg-white text-gray-800"
                        />
                    </div>
                    <Link
                        href="/admin/jobs/create"
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
                        <p className="text-sm font-medium">Đang tải danh sách tin tuyển dụng...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse whitespace-nowrap min-w-[800px]">
                            <thead>
                                <tr className="bg-gray-50 text-gray-600 text-sm uppercase tracking-wider">
                                    <th className="px-6 py-4 font-semibold border-b">Vị trí tuyển dụng</th>
                                    <th className="px-6 py-4 font-semibold border-b">Mã chiến dịch (ID)</th>
                                    <th className="px-6 py-4 font-semibold border-b w-32">Trạng thái</th>
                                    <th className="px-6 py-4 font-semibold border-b w-48">Ngày tạo</th>
                                    <th className="px-6 py-4 font-semibold border-b text-right w-32">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 text-sm text-gray-700">
                                {items.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-16 text-center text-gray-500">
                                            <div className="flex flex-col items-center">
                                                <Briefcase className="w-12 h-12 text-gray-300 mb-4" />
                                                <p className="text-lg font-medium text-gray-700 mb-1">
                                                    {debouncedSearch ? 'Không tìm thấy kết quả' : 'Chưa có tin tuyển dụng nào'}
                                                </p>
                                                <p className="text-sm text-gray-400">
                                                    {debouncedSearch ? 'Thử tìm kiếm với từ khóa khác' : 'Nhấp vào nút Thêm Mới để bắt đầu'}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    items.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-900 line-clamp-1">
                                                    {item.positions && item.positions.length > 0
                                                        ? item.positions.map(p => p.role).join(', ')
                                                        : 'Chiến dịch #' + item.id.substring(0, 8)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs text-gray-500">
                                                ID: {item.id.substring(0, 8)}...
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <label className="relative inline-flex items-center cursor-pointer select-none">
                                                        <input
                                                            type="checkbox"
                                                            className="sr-only peer"
                                                            checked={item.is_active}
                                                            disabled={togglingId === item.id}
                                                            onChange={() => handleToggleActive(item.id, item.is_active)}
                                                        />
                                                        <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-vinfast-blue ${togglingId === item.id ? 'opacity-55 cursor-not-allowed' : ''}`}></div>
                                                        <span className="ml-3 text-xs font-semibold text-gray-600 w-16">
                                                            {item.is_active ? 'Hoạt động' : 'Tạm ẩn'}
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
                                                    <button
                                                        onClick={() => handleDuplicate(item.id)}
                                                        disabled={duplicatingId === item.id || isPending}
                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-55 disabled:cursor-not-allowed"
                                                        title="Nhân bản tin tuyển dụng"
                                                    >
                                                        {duplicatingId === item.id ? (
                                                            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                                        ) : (
                                                            <Copy className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                    <Link
                                                        href={`/admin/jobs/${item.id}`}
                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                        title="Sửa tin tuyển dụng"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </Link>
                                                    <button
                                                        onClick={() => setDeletingJob(item)}
                                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                        title="Xóa tin tuyển dụng"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
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
                            Hiển thị từ <span className="font-semibold text-gray-900">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> đến <span className="font-semibold text-gray-900">{Math.min(currentPage * ITEMS_PER_PAGE, totalItems)}</span> trong tổng số <span className="font-semibold text-gray-900">{totalItems}</span> bản ghi
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

            {/* Custom Confirmation Dialog Modal */}
            {deletingJob && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 transform transition-all scale-100 animate-scale-up">
                        <div className="p-6">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-red-100 text-red-600 rounded-full shrink-0">
                                    <AlertCircle className="w-6 h-6" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-lg font-bold text-gray-900">
                                        Xác nhận xóa tuyển dụng?
                                    </h3>
                                    <p className="text-sm text-gray-500 leading-relaxed">
                                        Bạn có chắc chắn muốn xóa chiến dịch tuyển dụng <span className="font-bold text-gray-800">&ldquo;{deletingJob.positions && deletingJob.positions.length > 0 ? deletingJob.positions.map(p => p.role).join(', ') : 'Chiến dịch #' + deletingJob.id.substring(0, 8)}&rdquo;</span>? Hành động này sẽ loại bỏ hoàn toàn tin khỏi hệ thống và không thể khôi phục lại.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setDeletingJob(null)}
                                disabled={isDeleting}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors text-sm font-medium bg-white disabled:opacity-50"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50 flex items-center gap-2 shadow-sm"
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
