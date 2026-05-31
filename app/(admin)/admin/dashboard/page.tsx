'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Trash2, CheckCircle2, XCircle, Search, Pencil, X, ChevronLeft, ChevronRight } from 'lucide-react';

type Lead = {
    id: string;
    full_name: string;
    phone: string;
    email: string | null;
    car_model: string | null;
    notes: string | null;
    status: 'Mới' | 'Đã liên hệ' | 'Đang xử lý' | 'Hủy';
    created_at: string;
};

type Toast = { id: number; type: 'success' | 'error'; message: string };

const STATUS_OPTIONS = ['Mới', 'Đã liên hệ', 'Đang xử lý', 'Hủy'] as const;
const PAGE_SIZE = 10;

const statusStyle: Record<string, string> = {
    'Mới': 'bg-blue-100 text-blue-700 border-blue-200',
    'Đã liên hệ': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    'Đang xử lý': 'bg-purple-100 text-purple-700 border-purple-200',
    'Hủy': 'bg-red-100 text-red-700 border-red-200',
};

export default function AdminDashboard() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [leads, setLeads] = useState<Lead[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [connected, setConnected] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [actionLoading, setActionLoading] = useState(false);
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [editingLead, setEditingLead] = useState<Lead | null>(null);
    const [editForm, setEditForm] = useState<Partial<Lead>>({});
    const [editLoading, setEditLoading] = useState(false);

    // Read URL params
    const searchQ = searchParams.get('search') || '';
    const statusFilter = searchParams.get('status') || '';
    const currentPage = parseInt(searchParams.get('page') || '1', 10);

    // Local controlled search input (debounced)
    const [searchInput, setSearchInput] = useState(searchQ);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

    const addToast = useCallback((type: 'success' | 'error', message: string) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, type, message }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
    }, []);

    // Update URL helper — resets page when filters change
    const updateParams = useCallback((updates: Record<string, string | null>, resetPage = false) => {
        const params = new URLSearchParams(searchParams.toString());
        Object.entries(updates).forEach(([key, value]) => {
            if (value) params.set(key, value);
            else params.delete(key);
        });
        if (resetPage) params.delete('page');
        router.replace(`${pathname}?${params.toString()}`);
    }, [pathname, router, searchParams]);

    const fetchLeads = useCallback(async () => {
        setLoading(true);
        const q = searchParams.get('search') || '';
        const st = searchParams.get('status') || '';
        const page = parseInt(searchParams.get('page') || '1', 10);
        const from = (page - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        try {
            let query = supabase
                .from('leads')
                .select('*', { count: 'exact' })
                .order('created_at', { ascending: false })
                .range(from, to);

            if (q.trim()) {
                query = query.or(`full_name.ilike.%${q}%,phone.ilike.%${q}%`);
            }
            if (st) {
                query = query.eq('status', st);
            }

            const { data, error, count } = await query;
            if (error) throw error;

            setLeads((data || []) as Lead[]);
            setTotalCount(count ?? 0);
            setConnected(true);
            setSelectedIds([]);
        } catch (error: any) {
            console.error('[Dashboard] Fetch error:', error);
            setConnected(false);
        } finally {
            setLoading(false);
        }
    }, [searchParams]);

    useEffect(() => {
        setSearchInput(searchParams.get('search') || '');
        fetchLeads();
    }, [searchParams]);

    // Debounced search input
    const handleSearchChange = (value: string) => {
        setSearchInput(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            updateParams({ search: value.trim() || null }, true);
        }, 500);
    };

    // Single status update (optimistic)
    const updateSingleStatus = async (id: string, newStatus: Lead['status']) => {
        setLeads(prev => prev.map(l => l.id === id ? { ...l, status: newStatus } : l));
        const res = await fetch(`/api/admin/leads/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus }),
        });
        const data = await res.json();
        if (!res.ok) {
            addToast('error', data.error || 'Cập nhật thất bại.');
            fetchLeads();
        } else {
            addToast('success', 'Đã cập nhật trạng thái.');
        }
    };

    // Bulk update
    const handleBulkUpdateStatus = async (newStatus: string) => {
        if (!newStatus || selectedIds.length === 0) return;
        setActionLoading(true);
        const ids = [...selectedIds];
        setLeads(prev => prev.map(l => ids.includes(l.id) ? { ...l, status: newStatus as Lead['status'] } : l));
        setSelectedIds([]);
        try {
            const res = await fetch('/api/admin/leads', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids, status: newStatus }),
            });
            const data = await res.json();
            if (!res.ok) { addToast('error', data.error || 'Lỗi cập nhật.'); fetchLeads(); }
            else addToast('success', `Đã cập nhật ${ids.length} khách hàng.`);
        } finally { setActionLoading(false); }
    };

    // Bulk delete
    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        if (!window.confirm(`Xóa ${selectedIds.length} khách hàng? Không thể hoàn tác.`)) return;
        setActionLoading(true);
        const ids = [...selectedIds];
        setLeads(prev => prev.filter(l => !ids.includes(l.id)));
        setSelectedIds([]);
        try {
            const res = await fetch('/api/admin/leads', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids }),
            });
            const data = await res.json();
            if (!res.ok) { addToast('error', data.error || 'Lỗi xóa.'); fetchLeads(); }
            else { addToast('success', `Đã xóa ${ids.length} khách hàng.`); setTotalCount(c => c - ids.length); }
        } finally { setActionLoading(false); }
    };

    // Edit modal
    const openEditModal = (lead: Lead) => {
        setEditingLead(lead);
        setEditForm({ full_name: lead.full_name, phone: lead.phone, car_model: lead.car_model || '', notes: lead.notes || '', status: lead.status });
    };
    const handleSaveEdit = async () => {
        if (!editingLead) return;
        setEditLoading(true);
        try {
            const res = await fetch(`/api/admin/leads/${editingLead.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm),
            });
            const data = await res.json();
            if (!res.ok) addToast('error', data.error || 'Cập nhật thất bại.');
            else { addToast('success', 'Đã cập nhật thông tin khách hàng thành công.'); setEditingLead(null); fetchLeads(); }
        } finally { setEditLoading(false); }
    };

    const allSelected = leads.length > 0 && selectedIds.length === leads.length;

    return (
        <div className="space-y-4 relative">
            {/* Toast Area */}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
                {toasts.map(toast => (
                    <div key={toast.id} className={`flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold pointer-events-auto ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
                        {toast.type === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                        {toast.message}
                    </div>
                ))}
            </div>

            {/* Edit Modal */}
            {editingLead && (
                <div className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center p-4" onClick={() => setEditingLead(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900">Chỉnh sửa Lead</h3>
                            <button onClick={() => setEditingLead(null)} className="p-1.5 rounded-lg hover:bg-gray-100"><X size={17} className="text-gray-500" /></button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Họ và tên</label>
                                <input type="text" value={editForm.full_name || ''} onChange={e => setEditForm(p => ({ ...p, full_name: e.target.value }))} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-vinfast-blue bg-gray-50" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Số điện thoại</label>
                                <input type="text" value={editForm.phone || ''} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-vinfast-blue bg-gray-50" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Trạng thái</label>
                                <select value={editForm.status || 'Mới'} onChange={e => setEditForm(p => ({ ...p, status: e.target.value as Lead['status'] }))} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-vinfast-blue bg-gray-50 cursor-pointer">
                                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Sản phẩm</label>
                                <input type="text" value={editForm.car_model || ''} onChange={e => setEditForm(p => ({ ...p, car_model: e.target.value }))} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-vinfast-blue bg-gray-50" placeholder="VD: VinFast Klara S" />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Ghi chú</label>
                                <textarea rows={3} value={editForm.notes || ''} onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-vinfast-blue bg-gray-50 resize-none" />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                            <button onClick={() => setEditingLead(null)} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg">Hủy</button>
                            <button onClick={handleSaveEdit} disabled={editLoading} className="px-5 py-2 text-sm font-bold bg-vinfast-blue text-white rounded-lg hover:bg-blue-800 flex items-center gap-2 disabled:opacity-60">
                                {editLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                                Lưu thay đổi
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Search + Filter Row */}
            <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-1">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={searchInput}
                        onChange={e => handleSearchChange(e.target.value)}
                        placeholder="Tìm theo Họ tên hoặc Số điện thoại..."
                        className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-gray-200 bg-white text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-vinfast-blue"
                    />
                    {searchInput && (
                        <button onClick={() => handleSearchChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100">
                            <X size={13} className="text-gray-400" />
                        </button>
                    )}
                </div>

                {/* Status Filter */}
                <select
                    value={statusFilter}
                    onChange={e => updateParams({ status: e.target.value || null }, true)}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-vinfast-blue cursor-pointer font-medium text-gray-700 min-w-[180px]"
                >
                    <option value="">Tất cả trạng thái</option>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>

            {/* Bulk Action Bar */}
            {selectedIds.length > 0 && (
                <div className="bg-vinfast-blue/5 border border-vinfast-blue/20 px-5 py-3 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
                    <span className="text-vinfast-blue font-bold text-sm">Đã chọn <span className="text-base">{selectedIds.length}</span> khách hàng</span>
                    <div className="flex items-center gap-3">
                        <select className="h-9 px-3 bg-white border border-gray-200 rounded-lg text-sm font-medium shadow-sm outline-none focus:ring-2 focus:ring-vinfast-blue cursor-pointer disabled:opacity-50"
                            disabled={actionLoading}
                            onChange={e => { if (e.target.value) { handleBulkUpdateStatus(e.target.value); e.target.value = ''; } }}
                            defaultValue="">
                            <option value="" disabled>Đổi trạng thái...</option>
                            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <button onClick={handleBulkDelete} disabled={actionLoading}
                            className="h-9 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold flex items-center gap-2 disabled:opacity-50">
                            {actionLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Trash2 size={14} /> Xóa {selectedIds.length}</>}
                        </button>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Table Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-base font-bold text-gray-900">Danh Sách Khách Hàng</h2>
                    <div className="flex items-center gap-3">
                        {!loading && (
                            <span className="text-xs bg-gray-100 text-gray-600 font-semibold px-3 py-1 rounded-full">
                                {totalCount} kết quả
                            </span>
                        )}
                        <button onClick={fetchLeads} className="text-xs text-gray-400 hover:text-gray-700 underline transition-colors">
                            Làm mới
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="p-12 text-center flex flex-col items-center">
                        <div className="w-7 h-7 border-4 border-gray-200 border-t-vinfast-blue rounded-full animate-spin mb-3" />
                        <p className="text-gray-400 text-sm">Đang tải dữ liệu...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm min-w-[1060px]">
                            <thead>
                                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                                    <th className="px-5 py-3.5 w-12 text-center">
                                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 accent-vinfast-blue cursor-pointer"
                                            checked={allSelected} onChange={e => setSelectedIds(e.target.checked ? leads.map(l => l.id) : [])} />
                                    </th>
                                    <th className="px-5 py-3.5 font-semibold">Họ Tên</th>
                                    <th className="px-5 py-3.5 font-semibold">Số Điện Thoại</th>
                                    <th className="px-5 py-3.5 font-semibold">Sản Phẩm</th>
                                    <th className="px-5 py-3.5 font-semibold">Ghi Chú</th>
                                    <th className="px-5 py-3.5 font-semibold">Ngày Tạo</th>
                                    <th className="px-5 py-3.5 font-semibold">Trạng Thái</th>
                                    <th className="px-5 py-3.5 font-semibold text-center">Thao Tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {leads.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-5 py-14 text-center">
                                            <Search size={30} className="mx-auto text-gray-200 mb-2" />
                                            <p className="text-gray-400 text-sm">
                                                {searchQ || statusFilter
                                                    ? 'Không tìm thấy kết quả phù hợp.'
                                                    : 'Chưa có khách hàng đăng ký.'}
                                            </p>
                                        </td>
                                    </tr>
                                ) : leads.map(lead => (
                                    <tr key={lead.id} className={`hover:bg-gray-50/80 transition-colors ${selectedIds.includes(lead.id) ? 'bg-blue-50/40' : ''}`}>
                                        <td className="px-5 py-3.5 text-center">
                                            <input type="checkbox" className="w-4 h-4 rounded border-gray-300 accent-vinfast-blue cursor-pointer"
                                                checked={selectedIds.includes(lead.id)}
                                                onChange={e => setSelectedIds(prev => e.target.checked ? [...prev, lead.id] : prev.filter(x => x !== lead.id))} />
                                        </td>
                                        <td className="px-5 py-3.5 font-bold text-gray-900 whitespace-nowrap">{lead.full_name}</td>
                                        <td className="px-5 py-3.5 font-medium whitespace-nowrap">{lead.phone}</td>
                                        <td className="px-5 py-3.5 text-vinfast-blue font-medium whitespace-nowrap">
                                            {lead.car_model || <span className="text-gray-300 italic font-normal">—</span>}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="max-w-[180px] truncate text-gray-500" title={lead.notes || ''}>
                                                {lead.notes || <span className="text-gray-300 italic">—</span>}
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5 text-gray-400 whitespace-nowrap text-xs">
                                            {new Date(lead.created_at).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <select value={lead.status} onChange={e => updateSingleStatus(lead.id, e.target.value as Lead['status'])}
                                                className={`px-3 py-1.5 rounded-full text-xs font-bold border appearance-none cursor-pointer focus:outline-none shadow-sm ${statusStyle[lead.status] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                                                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </td>
                                        <td className="px-5 py-3.5 text-center">
                                            <button onClick={() => openEditModal(lead)} className="p-2 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-vinfast-blue transition-colors" title="Chỉnh sửa">
                                                <Pencil size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {!loading && totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                        <p className="text-sm text-gray-500">
                            Hiển thị <span className="font-bold text-gray-700">{(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, totalCount)}</span> / <span className="font-bold text-gray-700">{totalCount}</span> khách hàng
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => updateParams({ page: String(currentPage - 1) })}
                                disabled={currentPage <= 1}
                                className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft size={15} />
                            </button>

                            {/* Page numbers */}
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                                .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                                    if (idx > 0 && typeof arr[idx - 1] === 'number' && (p as number) - (arr[idx - 1] as number) > 1) acc.push('...');
                                    acc.push(p);
                                    return acc;
                                }, [])
                                .map((p, idx) => p === '...' ? (
                                    <span key={`ellipsis-${idx}`} className="w-8 text-center text-gray-400 text-sm">…</span>
                                ) : (
                                    <button
                                        key={p}
                                        onClick={() => updateParams({ page: String(p) })}
                                        className={`h-8 w-8 flex items-center justify-center rounded-lg text-sm font-semibold transition-colors border ${currentPage === p ? 'bg-vinfast-blue text-white border-vinfast-blue shadow-sm' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                    >
                                        {p}
                                    </button>
                                ))
                            }

                            <button
                                onClick={() => updateParams({ page: String(currentPage + 1) })}
                                disabled={currentPage >= totalPages}
                                className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight size={15} />
                            </button>
                        </div>
                        <p className="text-sm text-gray-500 font-medium">
                            Trang <span className="text-gray-800 font-bold">{currentPage}</span>/{totalPages}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
