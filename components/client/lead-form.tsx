'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { submitLead } from '@/app/actions/lead';

export default function LeadForm() {
    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        email: '',
        notes: ''
    });
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setStatus('idle');

        // Basic Validation
        if (!formData.full_name.trim() || !formData.phone.trim()) {
            setStatus('error');
            setErrorMessage('Vui lòng nhập đầy đủ Họ tên và Số điện thoại.');
            setLoading(false);
            return;
        }

        const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/g;
        if (!phoneRegex.test(formData.phone)) {
            setStatus('error');
            setErrorMessage('Số điện thoại không hợp lệ.');
            setLoading(false);
            return;
        }

        try {
            const formDataToSubmit = {
                full_name: formData.full_name,
                phone: formData.phone,
                email: formData.email,
                car_model: '', // Fallback empty string if component doesn't have car_model
                notes: formData.notes
            };

            const result = await submitLead(formDataToSubmit);

            if (!result.success) {
                setStatus('error');
                setErrorMessage(result.error || 'Có lỗi xảy ra khi gửi thông tin. Vui lòng thử lại sau.');
                return;
            }

            setStatus('success');
            setFormData({ full_name: '', phone: '', email: '', notes: '' });
        } catch (error) {
            console.error('Lead submission error:', error);
            setStatus('error');
            setErrorMessage('Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại mạng.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="py-20 bg-vinfast-blue text-white" id="lead-section">
            <div className="container mx-auto px-4 md:px-8">
                <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/20">
                    <div className="flex flex-col justify-center">
                        <h2 className="text-3xl md:text-5xl font-bold mb-6">Đăng Ký Lái Thử <br /> & Nhận Tư Vấn</h2>
                        <p className="text-blue-100 text-lg mb-8">Trải nghiệm thực tế các dòng ôtô điện VinFast tiên tiến nhất. Đội ngũ chuyên gia của chúng tôi luôn sẵn sàng hỗ trợ bạn.</p>
                        <ul className="space-y-4 text-blue-50 font-medium">
                            <li className="flex items-center gap-3">
                                <CheckCircle2 className="text-green-400" size={20} /> Tư vấn chọn xe phù hợp nhu cầu.
                            </li>
                            <li className="flex items-center gap-3">
                                <CheckCircle2 className="text-green-400" size={20} /> Cập nhật chương trình khuyến mãi mới nhất.
                            </li>
                            <li className="flex items-center gap-3">
                                <CheckCircle2 className="text-green-400" size={20} /> Hỗ trợ thủ tục trả góp 0% lãi suất.
                            </li>
                        </ul>
                    </div>

                    <div className="bg-white rounded-xl p-8 shadow-xl text-gray-800">
                        {status === 'success' ? (
                            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-8 animate-fade-in">
                                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-2">
                                    <CheckCircle2 size={32} />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900">Gửi thành công!</h3>
                                <p className="text-gray-600">Chúng tôi sẽ liên hệ lại sớm nhất.</p>
                                <button
                                    onClick={() => setStatus('idle')}
                                    className="mt-6 text-vinfast-blue font-semibold hover:underline"
                                >
                                    Gửi thêm yêu cầu
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                {status === 'error' && (
                                    <div className="p-3 bg-red-50 text-red-600 rounded-md flex items-start gap-2 text-sm">
                                        <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                        <span>{errorMessage}</span>
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Họ và tên *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.full_name}
                                        onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-md focus:rin-2 focus:ring-vinfast-blue focus:border-vinfast-blue transition-colors outline-none"
                                        placeholder="Nhập họ tên của bạn 123"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Số điện thoại *</label>
                                    <input
                                        type="tel"
                                        required
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-md focus:rin-2 focus:ring-vinfast-blue focus:border-vinfast-blue transition-colors outline-none"
                                        placeholder="VD: 0912345678"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Email <span className="text-gray-400 font-normal">(Không bắt buộc)</span></label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-md focus:ring-2 focus:ring-vinfast-blue focus:border-vinfast-blue transition-colors outline-none"
                                        placeholder="Nhập địa chỉ email"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Lời nhắn tư vấn <span className="text-gray-400 font-normal">(Không bắt buộc)</span></label>
                                    <textarea
                                        rows={3}
                                        value={formData.notes}
                                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-md focus:ring-2 focus:ring-vinfast-blue focus:border-vinfast-blue transition-colors outline-none resize-none"
                                        placeholder="Bạn cần chúng tôi tư vấn về dòng xe nào? hoặc có yêu cầu gì khác..."
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-vinfast-blue text-white py-4 rounded-md font-bold text-lg hover:bg-blue-800 transition-colors flex justify-center items-center gap-2 disabled:opacity-70"
                                >
                                    {loading ? (
                                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <>Gửi Thông Tin <Send size={18} /></>
                                    )}
                                </button>
                                <p className="text-xs text-gray-400 text-center mt-4">
                                    Bằng cách bấm Gửi, bạn đồng ý với Điều khoản Bảo mật của chúng tôi.
                                </p>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
