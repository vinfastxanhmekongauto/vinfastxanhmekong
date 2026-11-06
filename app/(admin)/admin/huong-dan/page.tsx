'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
    BookOpen,
    Plus,
    Edit3,
    Trash2,
    Loader2,
    Calendar,
    Car,
    Layers,
    Clock,
    ExternalLink
} from 'lucide-react';

interface ManualSummary {
    id: string;
    car_name: string;
    manufacture_year: number;
    version?: string;
    created_at?: string;
}

export default function AdminManualListPage() {
    const [manuals, setManuals] = useState<ManualSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchManuals = async () => {
        try {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('vehicle_manuals')
                .select('id, car_name, manufacture_year, version, created_at')
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Error fetching manuals:", error);
                setManuals([]);
            } else {
                setManuals(data || []);
            }
        } catch (err) {
            console.error("Error in fetchManuals:", err);
            setManuals([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchManuals();
    }, []);

    const handleDelete = async (id: string, carName: string) => {
        if (!confirm(`Bạn có chắc chắn muốn xóa sổ tay hướng dẫn cho xe ${carName}?`)) {
            return;
        }

        try {
            const { error } = await supabase
                .from('vehicle_manuals')
                .delete()
                .eq('id', id);

            if (error) {
                alert(`Lỗi khi xóa: ${error.message}`);
            } else {
                setManuals(prev => prev.filter(m => m.id !== id));
            }
        } catch (err: any) {
            alert(`Lỗi khi xóa: ${err.message}`);
        }
    };

    return (
        <div className="space-y-6">

            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
                        <BookOpen size={26} className="text-blue-600" />
                        Quản Lý Sổ Tay Hướng Dẫn
                    </h1>
                    <p className="text-xs text-gray-500 mt-1">
                        Danh sách các tài liệu hướng dẫn sử dụng xe VinFast trong hệ thống cơ sở dữ liệu.
                    </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    <Link
                        href="/dich-vu/huong-dan-su-dung"
                        target="_blank"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        <ExternalLink size={14} />
                        Xem Client UI
                    </Link>

                    <Link
                        href="/admin/huong-dan/them-moi"
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm hover:shadow-md transition-all"
                    >
                        <Plus size={18} />
                        Thêm Sổ Tay Mới
                    </Link>
                </div>
            </div>

            {/* Table Container */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-500 gap-3">
                        <Loader2 size={32} className="animate-spin text-blue-600" />
                        <p className="text-sm font-medium">Đang tải danh sách sổ tay...</p>
                    </div>
                ) : manuals.length === 0 ? (
                    <div className="py-16 text-center text-gray-500">
                        <BookOpen size={48} className="mx-auto text-gray-300 mb-3" />
                        <p className="font-semibold text-base text-gray-700">Chưa có sổ tay nào. Hãy thêm mới!</p>
                        <p className="text-xs text-gray-400 mt-1 mb-4">Tạo tài liệu hướng dẫn sử dụng mới cho các mẫu xe VinFast.</p>
                        <Link
                            href="/admin/huong-dan/them-moi"
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                        >
                            <Plus size={16} />
                            Thêm Sổ Tay Mới
                        </Link>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-700">
                            <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-600 uppercase tracking-wider">
                                <tr>
                                    <th className="py-3.5 px-6">Tên Xe</th>
                                    <th className="py-3.5 px-6">Năm Sản Xuất</th>
                                    <th className="py-3.5 px-6">Phiên Bản</th>
                                    <th className="py-3.5 px-6">Ngày Tạo</th>
                                    <th className="py-3.5 px-6 text-right">Thao Tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {manuals.map((item) => {
                                    const createdDate = item.created_at
                                        ? new Date(item.created_at).toLocaleDateString('vi-VN', {
                                            year: 'numeric',
                                            month: '2-digit',
                                            day: '2-digit'
                                        })
                                        : 'N/A';

                                    return (
                                        <tr key={item.id} className="hover:bg-blue-50/50 transition-colors">
                                            <td className="py-4 px-6 font-bold text-gray-900 flex items-center gap-2">
                                                <Car size={16} className="text-blue-600 shrink-0" />
                                                {item.car_name}
                                            </td>
                                            <td className="py-4 px-6 font-medium text-gray-700">
                                                <span className="inline-flex items-center gap-1">
                                                    <Calendar size={14} className="text-gray-400" />
                                                    {item.manufacture_year}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-800 px-2.5 py-0.5 rounded text-xs font-semibold">
                                                    <Layers size={12} className="text-gray-500" />
                                                    {item.version || 'v1.0'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-gray-500 text-xs">
                                                <span className="inline-flex items-center gap-1">
                                                    <Clock size={13} className="text-gray-400" />
                                                    {createdDate}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        href={`/admin/huong-dan/sua/${item.id}`}
                                                        className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                                        title="Sửa"
                                                    >
                                                        <Edit3 size={16} />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(item.id, item.car_name)}
                                                        className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                                        title="Xóa"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

        </div>
    );
}
