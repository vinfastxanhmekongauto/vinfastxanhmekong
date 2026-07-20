'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2, AlertCircle, MessageSquare } from 'lucide-react';
import { submitLead } from '@/app/actions/lead';
import { useSiteSettings } from '@/components/client/SiteSettingsProvider';
import { SearchableCarSelect, getCarDisplayName } from '@/components/client/quick-action-modals';
import { FALLBACK_EMAIL } from '@/lib/constants';

export default function ContactClient() {
    const { settings } = useSiteSettings();
    const fallbackAddress = "Số 10362, đường Võ Nguyên Giáp, P.Hưng Phú, TP.Cần Thơ";
    const fallbackPhone = "0946 156 156";
    const fallbackEmail = FALLBACK_EMAIL;
    const fallbackGoogleMaps = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3928.84145437704!2d105.76802281479443!3d10.029938992830847!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31a0883d2192b0f1%3A0x4c90a391d232ccce!2zMjc0IMSQLiAzMCBUaMOhbmcgNCwgWHXDom4gS2jDoW5oLCBOaW5oIEtp4buBdSwgQ-G6p24gVGjGoSwgVmnhu4d0IE5hbQ!5e0!3m2!1svi!2s!4v1680000000000!5m2!1svi!2s";

    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        car_model: '',
        notes: ''
    });
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const [products, setProducts] = useState<any[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(true);

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
                console.error('Error loading products for ContactClient:', err);
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
        return options;
    }, [products]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setStatus('idle');

        // Validation
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
            const result = await submitLead({ ...formData, lead_type: 'contact' });

            if (!result.success) {
                throw new Error(result.error);
            }

            setStatus('success');
            setFormData({ full_name: '', phone: '', car_model: '', notes: '' });
        } catch (error) {
            console.error('Submit error:', error);
            setStatus('error');
            setErrorMessage('Có lỗi xảy ra khi gửi thông tin. Vui lòng thử lại sau.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-vinfast-gray min-h-screen pb-20">
            {/* Page Header */}
            <div className="bg-vinfast-blue text-white py-16 md:py-24 mb-12 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&q=80&w=2000')] opacity-20 bg-cover bg-center mix-blend-overlay"></div>
                <div className="container relative z-10 mx-auto px-4 md:px-8 text-center max-w-4xl">
                    <h1 className="mb-8 md:mb-10 tracking-tight drop-shadow-md leading-tight">
                        <span className="block text-3xl md:text-4xl lg:text-5xl font-extrabold pb-2 mb-0 text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-white">
                            VinFast Xanh Mekong
                        </span>
                        <span className="block text-xl md:text-3xl font-medium text-white/90 leading-snug">
                            Đại lý ủy quyền chính thức của VinFast Việt Nam
                        </span>
                    </h1>
                    <div className="max-w-3xl mx-auto space-y-6 text-blue-100/90 text-sm md:text-lg leading-relaxed">
                        <p>
                            VinFast Xanh Mekong là đại lý ủy quyền chính thức từ VinFast Việt Nam, với phương châm hoạt động tận tâm, chu đáo và hết mình vì khách hàng. Đại lý luôn không ngừng nỗ lực để mang đến những sản phẩm xe điện thông minh và trải nghiệm dịch vụ tốt nhất dành cho bạn.
                        </p>
                        <p>
                            Chúng tôi tin rằng một chiếc xe tốt cần được đồng hành bởi một đại lý xứng tầm. Vì vậy, Xanh Mekong, một đại lý Tận tâm & chuyên nghiệp, không ngừng đầu tư vào con người, dịch vụ và trải nghiệm khách hàng, để mỗi lần ghé thăm đều là một trải nghiệm đáng nhớ.
                        </p>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 md:px-8 mt-10 relative z-20">
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                    <div className="grid grid-cols-1 lg:grid-cols-2">

                        {/* LEFT COLUMN: Contact Info & Map */}
                        <div className="p-8 md:p-12 bg-gray-50 flex flex-col h-full border-b lg:border-b-0 lg:border-r border-gray-200">
                            <h2 className="text-3xl font-bold text-gray-900 mb-8">Thông Tin Liên Hệ</h2>

                            <ul className="space-y-6 text-lg text-gray-700 mb-10">
                                <li className="flex items-start gap-4">
                                    <div className="p-3 bg-white rounded-full shadow-sm text-vinfast-blue shrink-0">
                                        <MapPin size={24} />
                                    </div>
                                    <div className="pt-1">
                                        <h4 className="font-bold text-gray-900 mb-1">Địa chỉ Showroom</h4>
                                        <p className="leading-relaxed text-gray-600">{settings?.address || fallbackAddress}</p>
                                    </div>
                                </li>

                                <li className="flex items-start gap-4">
                                    <div className="p-3 bg-white rounded-full shadow-sm text-vinfast-blue shrink-0">
                                        <Phone size={24} />
                                    </div>
                                    <div className="pt-1">
                                        <h4 className="font-bold text-gray-900 mb-1">Hotline Tư Vấn</h4>
                                        <a href={`tel:${settings?.phone?.replace(/\s+/g, '') || fallbackPhone.replace(/\s+/g, '')}`} className="text-vinfast-blue font-bold hover:underline">{settings?.phone || fallbackPhone}</a>
                                    </div>
                                </li>

                                <li className="flex items-start gap-4">
                                    <div className="p-3 bg-white rounded-full shadow-sm text-vinfast-blue shrink-0">
                                        <Mail size={24} />
                                    </div>
                                    <div className="pt-1">
                                        <h4 className="font-bold text-gray-900 mb-1">Email Kỹ Thuật & Bán Hàng</h4>
                                        <a href={`mailto:${settings?.email || fallbackEmail}`} className="text-vinfast-blue hover:underline break-all">{settings?.email || fallbackEmail}</a>
                                    </div>
                                </li>

                                <li className="flex items-start gap-4">
                                    <div className="p-3 bg-white rounded-full shadow-sm text-vinfast-blue shrink-0">
                                        <Clock size={24} />
                                    </div>
                                    <div className="pt-1">
                                        <h4 className="font-bold text-gray-900 mb-1">Giờ Mở Cửa</h4>
                                        <p className="text-gray-600">08:00 - 20:00 (Thứ 2 - Chủ Nhật)</p>
                                    </div>
                                </li>
                            </ul>

                            <div className="flex flex-col sm:flex-row gap-4 mb-8">
                                <a
                                    href={settings?.facebook_link || '#'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-md text-center"
                                >
                                    Fanpage Facebook
                                </a>
                                <a
                                    href={settings?.zalo_link || '#'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 px-6 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-md text-center"
                                >
                                    <MessageSquare size={20} /> Chat Zalo
                                </a>
                            </div>

                            {/* Google Maps Embed */}
                            {settings?.google_maps_link ? (
                                <div className="mt-auto h-64 w-full rounded-2xl overflow-hidden shadow-sm border border-gray-200 shrink-0">
                                    <iframe
                                        src={settings.google_maps_link}
                                        width="100%"
                                        height="100%"
                                        style={{ border: 0 }}
                                        allowFullScreen={true}
                                        loading="lazy"
                                        referrerPolicy="no-referrer-when-downgrade"
                                        className="border-0"
                                    ></iframe>
                                </div>
                            ) : !settings ? (
                                <div className="mt-auto h-64 w-full rounded-2xl overflow-hidden shadow-sm border border-gray-200 shrink-0">
                                    <iframe
                                        src={fallbackGoogleMaps}
                                        width="100%"
                                        height="100%"
                                        style={{ border: 0 }}
                                        allowFullScreen={true}
                                        loading="lazy"
                                        referrerPolicy="no-referrer-when-downgrade"
                                        className="border-0"
                                    ></iframe>
                                </div>
                            ) : null}
                        </div>

                        {/* RIGHT COLUMN: Lead Form */}
                        <div className="p-8 md:p-12 flex flex-col justify-center bg-white">
                            {status === 'success' ? (
                                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-12 animate-fade-in">
                                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4 shadow-sm border border-green-200">
                                        <CheckCircle2 size={40} />
                                    </div>
                                    <h3 className="text-3xl font-bold text-gray-900">Đăng ký thành công!</h3>
                                    <p className="text-gray-600 text-lg leading-relaxed max-w-md">
                                        Cảm ơn bạn! Chuyên viên tư vấn của VinFast Xanh Mekong sẽ liên hệ lại trong ít phút để hỗ trợ bạn.
                                    </p>
                                    <button
                                        onClick={() => setStatus('idle')}
                                        className="mt-8 px-8 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-full font-bold transition-colors"
                                    >
                                        Gửi thêm yêu cầu khác
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    <h2 className="text-3xl font-bold text-vinfast-blue mb-2">Đăng Ký Tư Vấn & Lái Thử</h2>
                                    <p className="text-gray-500 mb-8">Vui lòng điền thông tin bên dưới, chúng tôi sẽ hỗ trợ bạn nhanh nhất.</p>

                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        {status === 'error' && (
                                            <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl flex items-start gap-3 text-sm animate-fade-in shadow-sm">
                                                <AlertCircle size={20} className="shrink-0 mt-0.5 text-red-500" />
                                                <span className="font-medium">{errorMessage}</span>
                                            </div>
                                        )}

                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Họ và tên <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.full_name}
                                                onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                                className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-vinfast-blue focus:border-vinfast-blue transition-all outline-none text-gray-800"
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
                                                className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-vinfast-blue focus:border-vinfast-blue transition-all outline-none text-gray-800"
                                                placeholder="VD: 0912345678"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Dòng xe quan tâm <span className="text-gray-400 font-normal ml-1">(Tùy chọn)</span></label>
                                            <SearchableCarSelect
                                                value={formData.car_model}
                                                onChange={val => setFormData({ ...formData, car_model: val })}
                                                options={carVariantOptions}
                                                placeholder="-- Chọn dòng xe muốn lái thử --"
                                                bgColorClass="bg-gray-50"
                                                roundedClass="rounded-xl"
                                                paddingClass="px-5 py-3 text-gray-800"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Lời nhắn bổ sung <span className="text-gray-400 font-normal ml-1">(Tùy chọn)</span></label>
                                            <textarea
                                                rows={3}
                                                value={formData.notes}
                                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                                className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-vinfast-blue focus:border-vinfast-blue transition-all outline-none text-gray-800 resize-none"
                                                placeholder="Ví dụ: Tôi muốn tư vấn trả góp, tôi muốn lái thử vào thứ 7..."
                                            ></textarea>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full bg-vinfast-blue text-white py-4 px-6 rounded-xl font-bold hover:bg-blue-800 transition-colors flex items-center justify-center gap-2 mt-4 shadow-lg hover:shadow-xl disabled:bg-blue-300 disabled:cursor-not-allowed"
                                        >
                                            {loading ? (
                                                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            ) : (
                                                <>
                                                    Gửi Yêu Cầu <Send size={20} className="ml-1" />
                                                </>
                                            )}
                                        </button>
                                        <p className="text-center text-xs text-gray-500 mt-4">
                                            Thông tin của bạn sẽ được bảo mật tuyệt đối theo chính sách của chúng tôi.
                                        </p>
                                    </form>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
