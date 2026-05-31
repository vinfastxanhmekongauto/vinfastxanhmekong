'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { submitLead } from '@/app/actions/lead';

interface PromotionLeadFormProps {
    promotionTitle: string;
}

export default function PromotionLeadForm({ promotionTitle }: PromotionLeadFormProps) {
    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        notes: ''
    });
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setStatus('idle');

        if (!formData.full_name.trim() || !formData.phone.trim()) {
            setStatus('error');
            setErrorMessage('Vui lòng nhập đầy đủ Họ tên và Số điện thoại.');
            setLoading(false);
            return;
        }

        const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/g;
        if (!phoneRegex.test(formData.phone)) {
            setStatus('error');
            setErrorMessage('Số điện thoại không hợp lệ. Vui lòng kiểm tra lại.');
            setLoading(false);
            return;
        }

        try {
            const formDataToSubmit = {
                full_name: formData.full_name,
                phone: formData.phone,
                car_model: `Khuyến mãi: ${promotionTitle}`,
                notes: formData.notes
            };

            const result = await submitLead(formDataToSubmit);

            if (!result.success) {
                setStatus('error');
                setErrorMessage(result.error || 'Có lỗi xảy ra khi gửi thông tin. Vui lòng thử lại sau.');
                return;
            }

            setStatus('success');
            setFormData({ full_name: '', phone: '', notes: '' });
        } catch (error) {
            console.error('Submit error:', error);
            setStatus('error');
            setErrorMessage('Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại mạng.');
        } finally {
            setLoading(false);
        }
    };

    if (status === 'success') {
        return (
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 flex flex-col items-center justify-center text-center animate-fade-in relative z-10 box-border w-full">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 size={32} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Gửi thành công!</h3>
                <p className="text-gray-600 mb-6">Chúng tôi sẽ liên hệ lại sớm nhất.</p>
                <button
                    onClick={() => setStatus('idle')}
                    className="px-6 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg font-semibold transition-colors"
                >
                    Gửi yêu cầu khác
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl border-t-4 border-vinfast-blue w-full box-border">
            <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Nhận Ưu Đãi Ngay</h3>
                <p className="text-gray-600 text-sm">Để lại thông tin để hưởng ngay chương trình khuyến mãi đặc biệt này.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {status === 'error' && (
                    <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl flex items-start gap-2 text-sm animate-fade-in">
                        <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-500" />
                        <span>{errorMessage}</span>
                    </div>
                )}

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Họ và tên <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        required
                        value={formData.full_name}
                        onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-vinfast-blue outline-none transition-all"
                        placeholder="VD: Nguyễn Văn A"
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Số điện thoại <span className="text-red-500">*</span></label>
                    <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-vinfast-blue outline-none transition-all"
                        placeholder="VD: 0912345678"
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Yêu cầu tư vấn (Tự động)</label>
                    <input
                        type="text"
                        disabled
                        value={promotionTitle}
                        className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-vinfast-blue font-bold cursor-not-allowed text-sm truncate"
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Lời nhắn <span className="text-gray-400 font-normal ml-1">(Tùy chọn)</span></label>
                    <textarea
                        rows={2}
                        value={formData.notes}
                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-vinfast-blue outline-none transition-all resize-none"
                        placeholder="Ví dụ: Tư vấn trả góp..."
                    ></textarea>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-vinfast-blue text-white py-3.5 px-6 rounded-xl font-bold hover:bg-blue-800 transition-colors flex items-center justify-center gap-2 mt-4 shadow-md hover:shadow-lg disabled:bg-blue-300"
                >
                    {loading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <>Đăng Ký Nhận Ưu Đãi <Send size={18} className="ml-1" /></>
                    )}
                </button>
            </form>
        </div>
    );
}
