'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Send, CheckCircle2, AlertCircle, Calendar, ShieldCheck, ClipboardList, Car, Clock } from 'lucide-react';
import { SearchableCarSelect, getCarDisplayName } from '@/components/client/quick-action-modals';
import { submitLead } from '@/app/actions/lead';

const SERVICES = [
    'Bảo dưỡng định kỳ',
    'Kiểm tra tổng quát',
    'Sửa chữa',
    'Đồng sơn',
    'Bảo hành',
    'Kiểm tra pin',
    'Kiểm tra hệ thống sạc',
    'Khác'
];

const TIMESLOTS = [
    '08:00',
    '09:00',
    '10:00',
    '11:00',
    '13:00',
    '14:00',
    '15:00',
    '16:00',
    '17:00'
];

type Toast = { id: number; type: 'success' | 'error'; message: string };

interface ServiceBookingClientProps {
    bannerUrl?: string;
}

export default function ServiceBookingClient({ bannerUrl }: ServiceBookingClientProps) {
    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        car_model: '',
        other_car_model: '',
        license_plate: '',
        service: '',
        date: '',
        time: '',
        notes: '',
        privacy_policy_accepted: false
    });

    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const [products, setProducts] = useState<any[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((type: 'success' | 'error', message: string) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, type, message }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
    }, []);

    useEffect(() => {
        async function fetchProducts() {
            try {
                const { data, error } = await supabase
                    .from('products')
                    .select('id, name, variants')
                    .order('name');
                if (error) throw error;
                setProducts(data || []);
            } catch (err) {
                console.error('Error loading products for ServiceBookingClient:', err);
            } finally {
                setLoadingProducts(false);
            }
        }
        fetchProducts();
    }, []);

    const carVariantOptions = useMemo(() => {
        const options: string[] = [];
        products.forEach(p => {
            if (Array.isArray(p.variants) && p.variants.length > 0) {
                p.variants.forEach((v: any) => {
                    options.push(getCarDisplayName(p.name, v.name));
                });
            } else {
                options.push(getCarDisplayName(p.name));
            }
        });
        options.push('Khác');
        return options;
    }, [products]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setStatus('idle');

        // Validation
        if (!formData.full_name.trim() || !formData.phone.trim() || !formData.car_model || !formData.service || !formData.date || !formData.time) {
            setStatus('error');
            setErrorMessage('Vui lòng điền đầy đủ các thông tin bắt buộc.');
            setLoading(false);
            return;
        }

        if (formData.car_model === 'Khác' && !formData.other_car_model.trim()) {
            setStatus('error');
            setErrorMessage('Vui lòng điền thông tin dòng xe của bạn.');
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

        if (!formData.privacy_policy_accepted) {
            setStatus('error');
            setErrorMessage('Bạn phải đồng ý với Chính sách bảo mật thông tin để tiếp tục.');
            setLoading(false);
            return;
        }

        try {
            const finalCarModel = formData.car_model === 'Khác' ? formData.other_car_model : formData.car_model;

            // Notes formatting strictly as requested
            const formattedNotes = `Biển số xe: ${formData.license_plate || 'Chưa cung cấp'}
Dịch vụ: ${formData.service}
Ngày hẹn: ${formData.date}
Giờ hẹn: ${formData.time}
Ghi chú: ${formData.notes || 'Không có ghi chú'}`;

            const result = await submitLead({
                full_name: formData.full_name,
                phone: formData.phone,
                car_model: finalCarModel,
                lead_type: 'service_booking',
                notes: formattedNotes,
                appointment_date: formData.date,
                appointment_time: formData.time
            });

            if (!result.success) throw new Error(result.error);

            setStatus('success');
            addToast('success', 'Đặt lịch thành công. Chúng tôi sẽ liên hệ xác nhận trong thời gian sớm nhất.');

            // Reset form
            setFormData({
                full_name: '',
                phone: '',
                car_model: '',
                other_car_model: '',
                license_plate: '',
                service: '',
                date: '',
                time: '',
                notes: '',
                privacy_policy_accepted: false
            });
        } catch (err) {
            console.error('Lead submission error:', err);
            setStatus('error');
            setErrorMessage('Có lỗi xảy ra khi đặt lịch. Vui lòng liên hệ hotline hoặc thử lại sau.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-vinfast-gray min-h-screen pb-20">
            {/* Toast Notifications */}
            <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl text-white text-sm font-semibold pointer-events-auto border transition-all duration-300 ${toast.type === 'success'
                            ? 'bg-green-600 border-green-700'
                            : 'bg-red-600 border-red-700'
                            }`}
                    >
                        {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                        {toast.message}
                    </div>
                ))}
            </div>

            {/* Header Banner */}
            <div
                className="relative bg-gradient-to-br from-[#00358E] to-[#00205B] text-white py-16 md:py-24 mb-12 overflow-hidden bg-cover bg-center"
                style={{ backgroundImage: `url(${bannerUrl || '/default-banner.jpg'})` }}
            >
                {/* Dark overlay to improve text readability */}
                <div className="absolute inset-0 bg-black/50 z-0"></div>
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=2000')] opacity-15 bg-cover bg-center mix-blend-overlay z-0"></div>
                <div className="absolute right-0 bottom-0 pointer-events-none select-none opacity-5 translate-y-8 translate-x-8">
                    <span className="text-6xl md:text-9xl font-black italic uppercase tracking-tighter">
                        VinFast
                    </span>
                </div>

                <div className="container relative z-10 mx-auto px-4 md:px-8 text-center max-w-4xl">
                    <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest text-blue-150 border border-white/10 mb-4">
                        <Calendar size={12} />
                        Xưởng dịch vụ chính hãng
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight drop-shadow-md">
                        ĐẶT LỊCH DỊCH VỤ
                    </h1>
                    <p className="text-lg md:text-xl text-blue-105 leading-relaxed font-medium opacity-90 max-w-2xl mx-auto">
                        Đặt lịch bảo dưỡng, sửa chữa hoặc kiểm tra xe VinFast. Đội ngũ tư vấn sẽ liên hệ xác nhận trong thời gian sớm nhất.
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 md:px-8 mt-10 relative z-20 max-w-4xl">
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 p-6 md:p-12">
                    <div className="mb-8 border-b border-gray-100 pb-6">
                        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 flex items-center gap-2">
                            <ClipboardList className="text-vinfast-blue w-8 h-8" />
                            Thông Tin Đăng Ký
                        </h2>
                        <p className="text-gray-500 mt-1.5 text-sm">Vui lòng hoàn tất mẫu đăng ký đặt lịch dịch vụ dưới đây.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {status === 'error' && (
                            <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl flex items-start gap-3 text-sm animate-fade-in shadow-sm">
                                <AlertCircle size={20} className="shrink-0 mt-0.5 text-red-500" />
                                <span className="font-medium">{errorMessage}</span>
                            </div>
                        )}

                        {status === 'success' && (
                            <div className="p-4 bg-green-50 text-green-700 border border-green-200 rounded-xl flex items-start gap-3 text-sm animate-fade-in shadow-sm">
                                <CheckCircle2 size={20} className="shrink-0 mt-0.5 text-green-500" />
                                <span className="font-medium">Đặt lịch thành công. Đội ngũ CSKH sẽ liên hệ với bạn trong thời gian sớm nhất để xác nhận.</span>
                            </div>
                        )}

                        {/* Customer Info Section */}
                        <div className="space-y-5">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 border-l-4 border-vinfast-blue pl-2.5">
                                Thông tin khách hàng
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Họ và tên <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.full_name}
                                        onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                        className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-vinfast-blue focus:border-vinfast-blue transition-all outline-none text-gray-800 text-sm font-medium"
                                        placeholder="VD: Nguyễn Văn A"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Số điện thoại <span className="text-red-500">*</span></label>
                                    <input
                                        type="tel"
                                        required
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-vinfast-blue focus:border-vinfast-blue transition-all outline-none text-gray-800 text-sm font-medium"
                                        placeholder="VD: 0912345678"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Vehicle Info Section */}
                        <div className="space-y-5 pt-4 border-t border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 border-l-4 border-vinfast-blue pl-2.5">
                                <Car className="w-5 h-5 text-vinfast-blue" />
                                Thông tin xe
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Dòng xe <span className="text-red-500">*</span></label>
                                    {loadingProducts ? (
                                        <div className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-400 text-sm animate-pulse">
                                            Đang tải danh sách xe...
                                        </div>
                                    ) : (
                                        <SearchableCarSelect
                                            value={formData.car_model}
                                            onChange={val => setFormData({ ...formData, car_model: val })}
                                            options={carVariantOptions}
                                            placeholder="Chọn dòng xe của bạn"
                                            bgColorClass="bg-gray-50"
                                            roundedClass="rounded-xl"
                                            paddingClass="px-5 py-3.5 text-gray-800 text-sm font-medium"
                                        />
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Biển số xe <span className="text-gray-400 font-normal ml-1">(Không bắt buộc)</span></label>
                                    <input
                                        type="text"
                                        value={formData.license_plate}
                                        onChange={e => setFormData({ ...formData, license_plate: e.target.value })}
                                        className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-vinfast-blue focus:border-vinfast-blue transition-all outline-none text-gray-800 text-sm font-medium"
                                        placeholder="VD: 65A-123.45"
                                    />
                                </div>

                                {formData.car_model === 'Khác' && (
                                    <div className="md:col-span-2 animate-fade-in">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Tên dòng xe khác <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.other_car_model}
                                            onChange={e => setFormData({ ...formData, other_car_model: e.target.value })}
                                            className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-vinfast-blue focus:border-vinfast-blue transition-all outline-none text-gray-800 text-sm font-medium"
                                            placeholder="Nhập tên dòng xe khác..."
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Service booking options */}
                        <div className="space-y-5 pt-4 border-t border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 border-l-4 border-vinfast-blue pl-2.5">
                                <Clock className="w-5 h-5 text-vinfast-blue" />
                                Chi tiết dịch vụ & Thời gian hẹn
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="md:col-span-1">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Dịch vụ cần thực hiện <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <select
                                            required
                                            value={formData.service}
                                            onChange={e => setFormData({ ...formData, service: e.target.value })}
                                            className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-vinfast-blue focus:border-vinfast-blue transition-all outline-none text-gray-800 text-sm font-medium cursor-pointer appearance-none"
                                        >
                                            <option value="" disabled>-- Chọn dịch vụ --</option>
                                            {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                        </div>
                                    </div>
                                </div>

                                <div className="md:col-span-1">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Ngày hẹn <span className="text-red-500">*</span></label>
                                    <input
                                        type="date"
                                        required
                                        min={new Date().toISOString().split('T')[0]}
                                        value={formData.date}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                        className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-vinfast-blue focus:border-vinfast-blue transition-all outline-none text-gray-800 text-sm font-medium"
                                    />
                                </div>

                                <div className="md:col-span-1">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Giờ hẹn <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <select
                                            required
                                            value={formData.time}
                                            onChange={e => setFormData({ ...formData, time: e.target.value })}
                                            className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-vinfast-blue focus:border-vinfast-blue transition-all outline-none text-gray-800 text-sm font-medium cursor-pointer appearance-none"
                                        >
                                            <option value="" disabled>-- Chọn giờ --</option>
                                            {TIMESLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Extra notes */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Ghi chú bổ sung <span className="text-gray-400 font-normal ml-1">(Không bắt buộc)</span></label>
                            <textarea
                                rows={3}
                                value={formData.notes}
                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-vinfast-blue focus:border-vinfast-blue transition-all outline-none text-gray-800 text-sm font-medium resize-none"
                                placeholder="Mô tả tình trạng xe hoặc các yêu cầu cụ thể khác..."
                            />
                        </div>

                        {/* Privacy Checkbox */}
                        <div className="flex items-start bg-gray-50 p-4 rounded-xl border border-gray-150">
                            <div className="flex items-center h-5">
                                <input
                                    id="privacy_policy_accepted"
                                    name="privacy_policy_accepted"
                                    type="checkbox"
                                    required
                                    checked={formData.privacy_policy_accepted}
                                    onChange={e => setFormData({ ...formData, privacy_policy_accepted: e.target.checked })}
                                    className="focus:ring-vinfast-blue h-4 w-4 text-vinfast-blue border-gray-300 rounded cursor-pointer accent-vinfast-blue shrink-0"
                                />
                            </div>
                            <div className="ml-3 text-sm leading-relaxed">
                                <label htmlFor="privacy_policy_accepted" className="font-semibold text-gray-700 cursor-pointer flex items-center gap-1">
                                    Tôi đã đọc và đồng ý với
                                    <a href="/chinh-sach-bao-mat" target="_blank" className="text-vinfast-blue font-bold hover:underline inline-flex items-center gap-0.5">
                                        Chính sách bảo mật thông tin
                                        <ShieldCheck size={14} className="inline shrink-0" />
                                    </a>
                                </label>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-vinfast-blue text-white py-4 px-6 rounded-xl font-bold hover:bg-blue-800 transition-colors flex items-center justify-center gap-2 mt-4 shadow-lg hover:shadow-xl disabled:bg-blue-300 disabled:cursor-not-allowed text-base uppercase tracking-wider"
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    Đặt Lịch Ngay <Send size={18} className="ml-1" />
                                </>
                            )}
                        </button>
                        <p className="text-center text-xs text-gray-400 mt-2 font-medium">
                            * Vui lòng chuẩn bị xe sẵn sàng và mang theo sổ bảo hành khi đến lịch hẹn.
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}
