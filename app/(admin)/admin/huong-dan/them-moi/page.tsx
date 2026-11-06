'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
    BookOpen,
    PlusCircle,
    CheckCircle2,
    AlertCircle,
    Loader2,
    ArrowLeft,
    FileJson,
    Car,
    Calendar,
    Layers
} from 'lucide-react';

const INITIAL_JSON_TEMPLATE = JSON.stringify(
    [
        {
            "title": "1. Giới thiệu chung",
            "blocks": [
                {
                    "type": "paragraph",
                    "data": {
                        "text": "Chào mừng quý khách đến với tài liệu Sổ tay Hướng dẫn sử dụng xe điện VinFast."
                    }
                },
                {
                    "type": "alert",
                    "data": {
                        "style": "info",
                        "title": "LƯU Ý QUAN TRỌNG",
                        "text": "Trước khi vận hành xe lần đầu tiên, vui lòng đọc kỹ toàn bộ sổ tay hướng dẫn này để đảm bảo an toàn."
                    }
                }
            ],
            "children": [
                {
                    "title": "1.1. An toàn Hệ thống Pin Cao Áp",
                    "blocks": [
                        {
                            "type": "alert",
                            "data": {
                                "style": "danger",
                                "title": "CẢNH BÁO NGUY HỂM",
                                "text": "Tuyệt đối không tự ý tháo mở hoặc can thiệp vào các đường dây cáp màu cam (nguồn điện cao áp)."
                            }
                        },
                        {
                            "type": "list",
                            "data": {
                                "title": "Các nguyên tắc bảo quản pin:",
                                "items": [
                                    "Duy trì dung lượng pin hàng ngày từ 20% đến 80%",
                                    "Sử dụng trạm sạc chính hãng VinFast tiêu chuẩn",
                                    "Không để xe cạn kiệt pin 0% quá 14 ngày liên tục"
                                ]
                            }
                        }
                    ]
                }
            ]
        }
    ],
    null,
    2
);

export default function AdminManualAddPage() {
    const [carName, setCarName] = useState('VF 9');
    const [year, setYear] = useState('2026');
    const [version, setVersion] = useState('v1.0');
    const [documentJson, setDocumentJson] = useState(INITIAL_JSON_TEMPLATE);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);

        try {
            if (!carName.trim() || !year) {
                throw new Error("Vui lòng nhập Tên Mẫu Xe và Năm Sản Xuất.");
            }

            // Parse & validate JSON format
            let parsedDocument;
            try {
                parsedDocument = JSON.parse(documentJson);
            } catch (jsonErr: any) {
                throw new Error(`Cú pháp JSON không hợp lệ: ${jsonErr.message}`);
            }

            // Insert into Supabase table `vehicle_manuals`
            const { error } = await supabase
                .from('vehicle_manuals')
                .insert([
                    {
                        car_name: carName.trim(),
                        manufacture_year: parseInt(year, 10),
                        version: version.trim() || 'v1.0',
                        document: parsedDocument
                    }
                ]);

            if (error) {
                throw error;
            }

            setMessage({
                type: 'success',
                text: `Thêm mới sổ tay hướng dẫn cho xe ${carName} (${year}) thành công!`
            });

        } catch (err: any) {
            console.error("Error inserting manual into Supabase:", err);
            setMessage({
                type: 'error',
                text: err.message || "Đã xảy ra lỗi khi lưu vào cơ sở dữ liệu."
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* Navigation Header */}
                <div className="flex items-center justify-between">
                    <Link
                        href="/admin/huong-dan"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-blue-600 transition-colors"
                    >
                        <ArrowLeft size={16} />
                        Quay lại Danh sách
                    </Link>

                    <Link
                        href="/dich-vu/huong-dan-su-dung"
                        target="_blank"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors"
                    >
                        <BookOpen size={14} />
                        Xem Trang Client
                    </Link>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
                    <div className="border-b border-gray-100 pb-5 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-blue-100 text-blue-700 rounded-lg">
                                <PlusCircle size={24} />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">
                                    Thêm Sổ Tay Hướng Dẫn Mới
                                </h1>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Nhập thông tin mẫu xe và cấu trúc JSON document để lưu vào cơ sở dữ liệu `vehicle_manuals`.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Feedback Alert */}
                    {message && (
                        <div className={`p-4 rounded-lg border mb-6 flex items-start gap-3 ${
                            message.type === 'success'
                                ? 'bg-green-50 border-green-300 text-green-800'
                                : 'bg-red-50 border-red-300 text-red-800'
                        }`}>
                            {message.type === 'success' ? (
                                <CheckCircle2 size={20} className="text-green-600 shrink-0 mt-0.5" />
                            ) : (
                                <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
                            )}
                            <p className="text-sm font-medium leading-relaxed">
                                {message.text}
                            </p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Basic Info: 3 Columns Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                            {/* Tên Mẫu Xe */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5 flex items-center gap-1.5">
                                    <Car size={14} className="text-blue-600" />
                                    Tên Mẫu Xe
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ví dụ: VF 9"
                                    value={carName}
                                    onChange={(e) => setCarName(e.target.value)}
                                    className="w-full px-3.5 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-semibold"
                                />
                            </div>

                            {/* Năm Sản Xuất */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5 flex items-center gap-1.5">
                                    <Calendar size={14} className="text-blue-600" />
                                    Năm Sản Xuất
                                </label>
                                <input
                                    type="number"
                                    required
                                    placeholder="Ví dụ: 2026"
                                    value={year}
                                    onChange={(e) => setYear(e.target.value)}
                                    className="w-full px-3.5 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-semibold"
                                />
                            </div>

                            {/* Phiên Bản */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5 flex items-center gap-1.5">
                                    <Layers size={14} className="text-blue-600" />
                                    Phiên Bản
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ví dụ: v1.0 hoặc 2026.1"
                                    value={version}
                                    onChange={(e) => setVersion(e.target.value)}
                                    className="w-full px-3.5 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-semibold"
                                />
                            </div>

                        </div>

                        {/* JSON Document Input */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-xs font-bold text-gray-700 uppercase flex items-center gap-1.5">
                                    <FileJson size={14} className="text-blue-600" />
                                    Nội Dung Tài Liệu (Định Dạng JSON)
                                </label>
                                <span className="text-[11px] text-gray-400 font-mono">
                                    JSON Array of Section Objects
                                </span>
                            </div>
                            <textarea
                                rows={16}
                                required
                                value={documentJson}
                                onChange={(e) => setDocumentJson(e.target.value)}
                                className="w-full p-4 font-mono text-sm bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg outline-none transition-all leading-relaxed shadow-inner"
                                placeholder="Dán chuỗi JSON của tài liệu vào đây..."
                            />
                        </div>

                        {/* Submit Button */}
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-lg shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Đang lưu dữ liệu vào Supabase...
                                    </>
                                ) : (
                                    <>
                                        <PlusCircle size={18} />
                                        Lưu Dữ Liệu Sổ Tay
                                    </>
                                )}
                            </button>
                        </div>

                    </form>
                </div>

            </div>
        </div>
    );
}
