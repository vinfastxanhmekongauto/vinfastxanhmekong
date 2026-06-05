'use client';

import { useState, useEffect } from 'react';
import { Gift, Plus, Edit, Trash2, Save, Loader2, X, ImageIcon, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { updateServiceSettings } from '@/app/actions/service-settings';

type GiftItem = {
    id: string;
    name: string;
    points_required: number;
    image_url: string;
    usage_instructions: string;
    care_instructions: string;
};

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

// Safely delete an image file from Supabase Storage images bucket
async function deleteGiftImage(url: string) {
    try {
        const path = getStoragePathFromUrl(url);
        if (path) {
            console.log('Deleting orphaned gift image:', path);
            const { error } = await supabase.storage.from('images').remove([path]);
            if (error) {
                console.error('Error deleting gift image from storage:', error);
            } else {
                console.log('Successfully deleted gift image from storage:', path);
            }
        }
    } catch (err) {
        console.error('Failed to run gift image storage delete logic:', err);
    }
}

export default function GiftManager() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const [gifts, setGifts] = useState<GiftItem[]>([]);
    
    // Modal & Form States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [formGift, setFormGift] = useState<GiftItem>({
        id: '',
        name: '',
        points_required: 0,
        image_url: '',
        usage_instructions: '',
        care_instructions: ''
    });

    useEffect(() => {
        fetchGifts();
    }, []);

    const fetchGifts = async () => {
        try {
            const { data, error } = await supabase
                .from('service_settings')
                .select('gifts_data')
                .eq('service_type', 'gifts')
                .single();

            if (error) {
                console.error('Error fetching gifts data:', error);
                setMessage({ type: 'error', text: 'Không thể tải danh sách quà tặng.' });
                return;
            }

            if (data && data.gifts_data) {
                setGifts(data.gifts_data as GiftItem[]);
            }
        } catch (err) {
            console.error('Failed to fetch gifts data:', err);
            setMessage({ type: 'error', text: 'Đã xảy ra lỗi khi tải danh sách.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (index: number | null = null) => {
        if (index !== null) {
            setEditingIndex(index);
            setFormGift({ ...gifts[index] });
        } else {
            setEditingIndex(null);
            setFormGift({
                id: 'gift-' + Date.now(),
                name: '',
                points_required: 0,
                image_url: '',
                usage_instructions: '',
                care_instructions: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingIndex(null);
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormGift(prev => ({
            ...prev,
            [name]: name === 'points_required' ? parseInt(value) || 0 : value
        }));
    };

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const fd = new FormData();
            fd.append('file', file);
            fd.append('folder', 'gifts');

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: fd
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Upload failed');
            }

            const { url } = await res.json();
            setFormGift(prev => ({ ...prev, image_url: url }));
        } catch (err: any) {
            alert('Upload hình ảnh thất bại: ' + err.message);
        } finally {
            setIsUploading(false);
        }
    };

    const handleSaveForm = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formGift.name.trim()) {
            alert('Vui lòng nhập tên quà tặng');
            return;
        }
        if (formGift.points_required <= 0) {
            alert('Vui lòng nhập số điểm yêu cầu hợp lệ (> 0)');
            return;
        }
        if (!formGift.image_url) {
            alert('Vui lòng chọn hình ảnh quà tặng');
            return;
        }

        const updatedGifts = [...gifts];
        if (editingIndex !== null) {
            // Check if the image_url was updated to delete the old image
            const originalGift = gifts[editingIndex];
            if (originalGift && originalGift.image_url !== formGift.image_url) {
                if (originalGift.image_url) {
                    deleteGiftImage(originalGift.image_url);
                }
            }
            updatedGifts[editingIndex] = formGift;
        } else {
            updatedGifts.push(formGift);
        }

        setGifts(updatedGifts);
        handleCloseModal();
    };

    const handleDeleteGift = (index: number) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa quà tặng này không?')) {
            const giftToDelete = gifts[index];
            if (giftToDelete && giftToDelete.image_url) {
                deleteGiftImage(giftToDelete.image_url);
            }
            const updatedGifts = gifts.filter((_, idx) => idx !== index);
            setGifts(updatedGifts);
        }
    };

    const handleSaveCatalog = async () => {
        setIsSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const result = await updateServiceSettings('gifts', {
                gifts_data: gifts
            });

            if (result.success) {
                setMessage({ type: 'success', text: 'Danh sách quà tặng đã được lưu thành công.' });
                await fetchGifts();
                router.refresh();
            } else {
                setMessage({ type: 'error', text: result.error || 'Lưu danh sách thất bại.' });
            }
        } catch (error: any) {
            console.error('Failed to update catalog', error);
            setMessage({ type: 'error', text: error.message || 'Lỗi khi lưu quà tặng.' });
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
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center gap-2">
                        <Gift className="w-5 h-5 text-vinfast-blue" />
                        Danh Sách Quà Tặng Đổi Điểm
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Quản lý danh mục quà tặng đổi điểm thành viên cho khách hàng dịch vụ.
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => handleOpenModal()}
                        className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Thêm Quà Tặng
                    </button>
                    <button
                        onClick={handleSaveCatalog}
                        disabled={isSaving}
                        className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-vinfast-blue hover:bg-blue-805 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                                Đang Lưu...
                            </>
                        ) : (
                            <>
                                <Save className="-ml-1 mr-2 h-4 w-4" />
                                Lưu Thay Đổi Danh Mục
                            </>
                        )}
                    </button>
                </div>
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

            {/* Catalog Grid */}
            <div className="p-6">
                {gifts.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
                        <Gift className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-550 text-sm">Chưa có quà tặng nào trong danh mục. Nhấp "Thêm Quà Tặng" để bắt đầu.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {gifts.map((gift, idx) => (
                            <div key={gift.id || idx} className="border border-gray-200 rounded-2xl p-4 flex gap-4 bg-gray-50 hover:shadow-md transition-shadow relative group">
                                <div className="relative w-28 h-28 shrink-0 rounded-xl overflow-hidden bg-white border border-gray-150">
                                    <Image
                                        src={gift.image_url}
                                        alt={gift.name}
                                        fill
                                        className="object-cover"
                                        unoptimized
                                    />
                                </div>
                                <div className="flex-1 min-w-0 space-y-1">
                                    <h4 className="text-base font-bold text-gray-900 truncate">{gift.name}</h4>
                                    <div className="inline-block px-2.5 py-0.5 bg-red-50 border border-red-100 rounded-full text-xs font-bold text-red-650">
                                        {gift.points_required} điểm
                                    </div>
                                    <div className="text-xs text-gray-500 line-clamp-2">
                                        <strong>HDSD:</strong> {gift.usage_instructions || 'Chưa cập nhật'}
                                    </div>
                                    <div className="text-xs text-gray-500 line-clamp-2">
                                        <strong>HDBQ:</strong> {gift.care_instructions || 'Chưa cập nhật'}
                                    </div>
                                </div>
                                <div className="absolute top-4 right-4 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleOpenModal(idx)}
                                        className="p-1.5 bg-white border border-gray-300 rounded-md text-gray-600 hover:text-blue-600 hover:bg-blue-50 cursor-pointer shadow-sm"
                                        title="Chỉnh sửa"
                                    >
                                        <Edit className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteGift(idx)}
                                        className="p-1.5 bg-white border border-gray-300 rounded-md text-gray-600 hover:text-red-600 hover:bg-red-50 cursor-pointer shadow-sm"
                                        title="Xóa"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal Form */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-gray-200 animate-fade-in flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-gray-150 flex justify-between items-center bg-gray-50">
                            <h4 className="font-bold text-gray-900 text-base">
                                {editingIndex !== null ? 'Chỉnh Sửa Quà Tặng' : 'Thêm Quà Tặng Mới'}
                            </h4>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-650 cursor-pointer">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveForm} className="p-6 space-y-4 overflow-y-auto flex-1">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Name */}
                                <div className="sm:col-span-2 space-y-1">
                                    <label className="block text-sm font-semibold text-gray-700">Tên quà tặng *</label>
                                    <input
                                        type="text"
                                        name="name"
                                        required
                                        value={formGift.name}
                                        onChange={handleFormChange}
                                        className="shadow-sm focus:ring-vinfast-blue focus:border-vinfast-blue block w-full sm:text-sm border-gray-300 rounded-md py-2.5 px-3 border"
                                        placeholder="Nhập tên quà tặng..."
                                    />
                                </div>

                                {/* Points Required */}
                                <div className="space-y-1">
                                    <label className="block text-sm font-semibold text-gray-700">Số điểm yêu cầu *</label>
                                    <input
                                        type="number"
                                        name="points_required"
                                        required
                                        min="1"
                                        value={formGift.points_required}
                                        onChange={handleFormChange}
                                        className="shadow-sm focus:ring-vinfast-blue focus:border-vinfast-blue block w-full sm:text-sm border-gray-300 rounded-md py-2.5 px-3 border"
                                    />
                                </div>

                                {/* Image Upload */}
                                <div className="space-y-1">
                                    <label className="block text-sm font-semibold text-gray-700">Hình ảnh quà tặng *</label>
                                    <div className="flex gap-2 items-center">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="hidden"
                                            id="gift-image-input"
                                        />
                                        <label
                                            htmlFor="gift-image-input"
                                            className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-md text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 cursor-pointer shadow-sm shrink-0"
                                        >
                                            <ImageIcon className="w-3.5 h-3.5" />
                                            {isUploading ? 'Đang tải...' : 'Chọn ảnh'}
                                        </label>
                                        {formGift.image_url && (
                                            <span className="text-xs text-green-600 font-medium truncate">Đã tải lên</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Image Preview */}
                            {formGift.image_url && (
                                <div className="relative h-32 w-full max-w-[200px] bg-gray-50 rounded-xl overflow-hidden border border-gray-200">
                                    <Image
                                        src={formGift.image_url}
                                        alt="Preview"
                                        fill
                                        className="object-cover"
                                        unoptimized
                                    />
                                </div>
                            )}

                            {/* Usage Instructions */}
                            <div className="space-y-1">
                                <label className="block text-sm font-semibold text-gray-700">Hướng dẫn sử dụng</label>
                                <textarea
                                    name="usage_instructions"
                                    rows={3}
                                    value={formGift.usage_instructions}
                                    onChange={handleFormChange}
                                    className="shadow-sm focus:ring-vinfast-blue focus:border-vinfast-blue block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border leading-relaxed"
                                    placeholder="Nhập hướng dẫn sử dụng, xuống dòng cho mỗi mục..."
                                />
                            </div>

                            {/* Care Instructions */}
                            <div className="space-y-1">
                                <label className="block text-sm font-semibold text-gray-700">Hướng dẫn bảo quản</label>
                                <textarea
                                    name="care_instructions"
                                    rows={3}
                                    value={formGift.care_instructions}
                                    onChange={handleFormChange}
                                    className="shadow-sm focus:ring-vinfast-blue focus:border-vinfast-blue block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border leading-relaxed"
                                    placeholder="Nhập hướng dẫn bảo quản, xuống dòng cho mỗi mục..."
                                />
                            </div>

                            {/* Form Submit */}
                            <div className="pt-4 border-t border-gray-150 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer shadow-sm"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={isUploading}
                                    className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-vinfast-blue hover:bg-blue-805 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Đồng Ý
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
