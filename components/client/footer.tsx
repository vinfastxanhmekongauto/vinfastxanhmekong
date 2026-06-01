'use client';

import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Phone, Mail, Clock, Facebook } from 'lucide-react';
import { useSiteSettings } from '@/components/client/SiteSettingsProvider';

export default function Footer() {
    const { settings } = useSiteSettings();
    const fallbackAddress = "Số 10362, đường Võ Nguyễn Giáp, phường Hưng Phú, TP. Cần Thơ";
    const fallbackPhone = "0907 697 036";
    const fallbackEmail = "vinfastxanhmekong@gmail.com";
    const fallbackGoogleMaps = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3928.84145437704!2d105.76802281479443!3d10.029938992830847!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31a0883d2192b0f1%3A0x4c90a391d232ccce!2zMjc0IMSQLiAzMCBUaMOhbmcgNCwgWHXDom4gS2jDoW5oLCBOaW5oIEtp4buBdSwgQ-G6p24gVGjGoSwgVmnhu4d0IE5hbQ!5e0!3m2!1svi!2s!4v1680000000000!5m2!1svi!2s";

    return (
        <footer className="bg-gray-900 text-white pt-16 pb-8 border-t-4 border-vinfast-blue">
            <div className="container mx-auto px-4 md:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                    {/* Column 1: About & Info */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="relative w-14 h-14 shrink-0">
                                <Image
                                    src="/logo-vinfast.svg"
                                    alt="VinFast Logo"
                                    fill
                                    className="object-contain"
                                    unoptimized
                                />
                            </div>
                            <div className="flex flex-col justify-center">
                                <span className="font-black text-white text-2xl tracking-wider leading-none">VINFAST</span>
                                <div className="flex items-center mt-1">
                                    <span className="font-normal text-white text-sm tracking-widest leading-none">XANH MEKONG</span>
                                </div>
                            </div>
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            Đại lý ôtô điện VinFast chính hãng tại Cần Thơ. Chúng tôi cam kết mang đến những phương tiện di chuyển xanh, thông minh và thân thiện với môi trường, hướng tới một tương lai bền vững.
                        </p>
                    </div>

                    {/* Column 2: Quick Links */}
                    <div className="space-y-4">
                        <h4 className="text-lg font-bold mb-6">Liên Kết Nhanh</h4>
                        <ul className="space-y-3 text-sm text-gray-400">
                            <li><Link href="/products" className="hover:text-vinfast-blue transition-colors">Tất cả ôtô điện</Link></li>
                            <li><Link href="/promotions" className="hover:text-vinfast-blue transition-colors">Chương trình khuyến mãi</Link></li>
                            <li><Link href="/about" className="hover:text-vinfast-blue transition-colors">Về chúng tôi</Link></li>
                            <li><Link href="/blog" className="hover:text-vinfast-blue transition-colors">Tin tức & Sự kiện</Link></li>
                        </ul>
                    </div>

                    {/* Column 3: Contact Info */}
                    <div className="space-y-4 lg:col-span-2">
                        <h4 className="text-lg font-bold text-white mb-6">Hệ Thống Showroom VinFast Xanh Mekong – Cần Thơ</h4>
                        <ul className="space-y-4 text-sm text-gray-200">
                            <li className="flex items-start gap-4">
                                <MapPin className="text-gray-300 shrink-0 mt-0.5" size={20} />
                                <span className="leading-relaxed"> {settings?.address || fallbackAddress}</span>
                            </li>
                            <li className="flex items-center gap-4">
                                <Phone className="text-gray-300 shrink-0" size={20} />
                                <span>Hotline/Zalo: <a href={`tel:${settings?.phone?.replace(/\s+/g, '') || fallbackPhone.replace(/\s+/g, '')}`} className="font-bold text-white hover:text-vinfast-blue transition-colors">{settings?.phone || fallbackPhone}</a></span>
                            </li>
                            <li className="flex items-center gap-4">
                                <Mail className="text-gray-300 shrink-0" size={20} />
                                <span>Email: <a href={`mailto:${settings?.email || fallbackEmail}`} className="font-medium text-white hover:text-vinfast-blue transition-colors">{settings?.email || fallbackEmail}</a></span>
                            </li>
                            <li className="flex items-center gap-4">
                                <Clock className="text-gray-300 shrink-0" size={20} />
                                <span>Giờ mở cửa: 08:00 - 20:00 (Thứ 2 - Chủ Nhật)</span>
                            </li>
                        </ul>
                        <div className="pt-4 flex items-center gap-4">
                            <a href={settings?.facebook_link || '#'} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center hover:bg-blue-700 transition">
                                <Facebook size={20} fill="white" />
                            </a>
                            <a href={settings?.zalo_link || '#'} target="_blank" rel="noopener noreferrer" className="h-10 px-4 rounded-full bg-blue-500 flex items-center justify-center font-bold text-sm hover:bg-blue-600 transition">
                                Zalo Chat
                            </a>
                        </div>
                    </div>
                </div>

                {/* Google Maps Embed */}
                {settings?.google_maps_link && (
                    <div className="w-full h-[250px] md:h-[350px] bg-gray-800 rounded-xl overflow-hidden mb-12 border border-gray-700">
                        <iframe
                            src={settings.google_maps_link}
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            allowFullScreen={true}
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                        ></iframe>
                    </div>
                )}

                {/* Fallback Map if settings not loaded yet */}
                {!settings && fallbackGoogleMaps && (
                    <div className="w-full h-[250px] md:h-[350px] bg-gray-800 rounded-xl overflow-hidden mb-12 border border-gray-700">
                        <iframe
                            src={fallbackGoogleMaps}
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            allowFullScreen={true}
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                        ></iframe>
                    </div>
                )}

                <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-gray-500">
                    <p>&copy; {new Date().getFullYear()} VinFast Xanh Mekong. Tất cả quyền được bảo lưu.</p>
                    <div className="flex gap-4 mt-4 md:mt-0">
                        <Link href="/privacy" className="hover:text-white transition">Chính sách bảo mật</Link>
                        <Link href="/terms" className="hover:text-white transition">Điều khoản sử dụng</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
