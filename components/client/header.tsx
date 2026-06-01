'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X, MapPin, Map, ChevronDown, Facebook } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ProductDisplay } from './product-card';

const CATEGORIES = [
    { id: 'dong_co_dien', label: 'XE ĐỘNG CƠ ĐIỆN' },
    { id: 'dich_vu', label: 'XE DỊCH VỤ' }
];

export default function Header({ products = [] }: { products?: ProductDisplay[] }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
    const [settings, setSettings] = useState<any>(null);
    const [activeTab, setActiveTab] = useState('dong_co_dien');
    const pathname = usePathname();

    const toggleSubmenu = (menu: string) => {
        setMobileExpanded(mobileExpanded === menu ? null : menu);
    };

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data } = await supabase.from('site_settings').select('*').single();
                if (data) {
                    setSettings(data);
                }
            } catch (error) {
                console.error("Failed to fetch settings for header:", error);
            }
        };
        fetchSettings();
    }, []);

    const isActive = (path: string) => {
        if (path === '/products') {
            return pathname.startsWith('/products');
        }
        return pathname === path;
    };

    const getLinkClass = (path: string, baseClass: string = '') => {
        const activeClass = 'text-blue-600';
        const inactiveClass = 'text-gray-800';
        return `${baseClass} font-bold hover:text-blue-600 uppercase text-sm transition-colors ${isActive(path) ? activeClass : inactiveClass}`;
    };

    return (
        <header className="sticky top-0 z-50 w-full">
            <div className="relative z-20 w-full bg-white border-b border-gray-300 shadow-sm">
                <div className="flex justify-between items-center px-4 py-3 lg:px-8 lg:py-2 max-w-7xl mx-auto h-full">
                    {/* Left Section (Logo) */}
                    <Link href="/" className="flex items-center gap-3 shrink-0 h-full py-2">
                        <div className="relative h-10 w-10 md:h-12 md:w-12 shrink-0">
                            <Image
                                src="/logo-vinfast.svg"
                                alt="VinFast Logo"
                                fill
                                className="object-contain"
                                priority
                                unoptimized
                            />
                        </div>
                        <div className="flex flex-col justify-center">
                            <span className="font-black text-black text-xl md:text-2xl tracking-wider leading-none">VINFAST</span>
                            <span className="font-normal text-black text-[10px] md:text-sm tracking-widest leading-none mt-1">XANH MEKONG</span>
                        </div>
                    </Link>

                    {/* Right Section (Wrapper) */}
                    <div className="hidden lg:flex flex-col flex-grow justify-center pl-8">
                        {/* Top Row (Utilities) */}
                        <div className="w-full">
                            <div className="flex items-center gap-6 border-b border-gray-300 pb-2 w-max ml-auto">
                                <a href={settings?.link_gf_xanh_mekong || '#'} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:opacity-80">
                                    <img src="/logo_gf.webp" alt="GF Logo" className="h-4 w-auto object-contain" />
                                    <span className="text-sm text-gray-600 transition-colors">Xanh Mekong</span>
                                </a>

                                <a href={settings?.link_xe_may_dien || '#'} target='_blank' rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-blue-600">
                                    <MapPin size={16} />
                                    <span>Xe máy điện Vinfast</span>
                                </a>

                                <a href={settings?.link_share_vi_tri || settings?.google_maps_link || '#'} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-blue-600">
                                    <Map size={16} />
                                    <span>Vị trí</span>
                                </a>

                                <div className="flex items-center gap-2">
                                    <a href={settings?.facebook_link || '#'} target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors" title="Theo dõi Fanpage Vinfast Xanh Mekong">
                                        <Facebook size={14} className="text-[#1877F2]" />
                                    </a>
                                    <a href={settings?.tiktok_link || '#'} target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors" title="Theo dõi TikTok Vinfast Xanh Mekong">
                                        <svg fill="currentColor" viewBox="0 0 448 512" width="14" height="14" className="text-black">
                                            <path d="M448 209.91a210.06 210.06 0 0 1-122.77-39.25v178.72A162.55 162.55 0 1 1 185 188.31v89.89a74.62 74.62 0 1 0 52.23 71.18V0h88a121.18 121.18 0 0 0 1.86 22.17A122.18 122.18 0 0 0 381 102.39a121.43 121.43 0 0 0 67 20.14Z" />
                                        </svg>
                                    </a>
                                    <a href={settings?.zalo_link || '#'} target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors" title="Liên hệ Zalo Vinfast Xanh Mekong">
                                        <img src="/zalo-icon.png" alt="Zalo" className="w-5 h-5 object-contain" />
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Row (Main Navigation) */}
                        <nav className="flex justify-end items-center gap-8 pt-3">
                            <Link href="/" className={`${getLinkClass('/')} pb-3`}>TRANG CHỦ</Link>

                            {/* SẢN PHẨM Mega Menu */}
                            <div className="group relative">
                                <Link href="/products" className={`${getLinkClass('/products')} flex items-center gap-1 pb-3`}>
                                    SẢN PHẨM <ChevronDown size={16} />
                                </Link>
                                {/* Invisible bridge (pt-3) & Mega Menu Content */}
                                <div className="absolute top-full left-1/2 -translate-x-1/2 w-[90vw] max-w-6xl bg-white shadow-xl rounded-b-xl border-t border-gray-200 z-50 invisible opacity-0 translate-y-2 transition-all duration-300 ease-in-out group-hover:visible group-hover:opacity-100 group-hover:translate-y-0">
                                    <div className="p-6 pb-0">
                                        {/* Tabs */}
                                        <div className="flex justify-center items-center gap-6 border-b border-gray-200 mb-2">
                                            {CATEGORIES.map((cat) => (
                                                <button
                                                    key={cat.id}
                                                    onClick={(e) => { e.preventDefault(); setActiveTab(cat.id); }}
                                                    className={`pb-2 border-b-2 font-bold text-sm transition-colors ${activeTab === cat.id
                                                        ? 'border-[#1464F4] text-[#1464F4]'
                                                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                                                        }`}
                                                >
                                                    {cat.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    {/* Scrollable Container */}
                                    <div className="max-h-[calc(100vh-140px)] overflow-y-auto p-6 pt-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                                        {/* 4-Column Grid */}
                                        <div className="grid grid-cols-4 gap-6">
                                            {products.filter(car => car.category === activeTab).map((car) => {
                                                const imageUrl = car.thumbnail_url || `/images/products/${car.slug}.webp`;
                                                let priceText = 'Giá từ: Liên hệ';
                                                if (car.variants && car.variants.length > 0) {
                                                    const prices = car.variants.map(v => v.price).filter(p => typeof p === 'number');
                                                    if (prices.length > 0) {
                                                        const lowest = Math.min(...prices);
                                                        priceText = `Giá từ: ${new Intl.NumberFormat('vi-VN').format(lowest)} VNĐ`;
                                                    }
                                                }
                                                return (
                                                    <div key={car.id} className="group/car block hover:bg-gray-50 p-2 rounded transition-colors border border-transparent hover:border-gray-100">
                                                        <Link href={`/products/${car.slug}`} className="block relative h-32 w-full mb-4 bg-gray-50 rounded overflow-hidden">
                                                            <Image
                                                                src={imageUrl}
                                                                alt={car.name}
                                                                fill
                                                                className="object-contain group-hover/car:scale-105 transition-transform duration-500"
                                                                unoptimized
                                                            />
                                                        </Link>
                                                        <Link href={`/products/${car.slug}`} className="block">
                                                            <h4 className="text-lg font-bold text-gray-800 mb-1 hover:text-[#1464F4] transition-colors">{car.name}</h4>
                                                        </Link>
                                                        <p className="text-sm text-gray-500 mb-4">{priceText}</p>
                                                        <Link href={`/products/${car.slug}`} className="text-[#1464F4] text-sm hover:underline transition-colors inline-block mt-1">
                                                            Xem các mẫu {car.name} &gt;
                                                        </Link>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* DỊCH VỤ Dropdown */}
                            <div className="group relative">
                                <Link href="/services" className={`${getLinkClass('/services')} flex items-center gap-1 pb-3`}>
                                    DỊCH VỤ <ChevronDown size={16} />
                                </Link>
                                <div className="absolute top-full right-0 w-56 pt-3 invisible opacity-0 translate-y-2 transition-all duration-300 ease-in-out z-50 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0">
                                    <div className="bg-white shadow-xl border-t-4 border-gray-300 rounded-b-lg overflow-hidden">
                                        <ul className="py-2">
                                            <li>
                                                <Link href="/services" className="block px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors">Đặt hẹn</Link>
                                            </li>
                                            <li>
                                                <Link href="/services" className="block px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors">Chăm sóc khách hàng</Link>
                                            </li>
                                            <li>
                                                <Link href="/services" className="block px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors">Quà tặng VinFast</Link>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* TIN TỨC & KHUYẾN MÃI Dropdown */}
                            <div className="group relative">
                                <Link href="/blog" className={`${getLinkClass('/blog')} flex items-center gap-1 pb-3`}>
                                    TIN TỨC & KHUYẾN MÃI <ChevronDown size={16} />
                                </Link>
                                <div className="absolute top-full right-0 w-64 pt-3 invisible opacity-0 translate-y-2 transition-all duration-300 ease-in-out z-50 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0">
                                    <div className="bg-white shadow-xl border-t-4 border-gray-300 rounded-b-lg overflow-hidden">
                                        <ul className="py-2">
                                            <li>
                                                <Link href="/blog" className="block px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors">Khuyến mãi kinh doanh</Link>
                                            </li>
                                            <li>
                                                <Link href="/blog" className="block px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors">Khuyến mãi dịch vụ</Link>
                                            </li>
                                            <li>
                                                <Link href="/blog" className="block px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors">Giấy phép môi trường</Link>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <Link href="/tuyen-dung" className={`${getLinkClass('/tuyen-dung')} pb-3`}>TUYỂN DỤNG</Link>
                            <Link href="/contact" className={`${getLinkClass('/contact')} pb-3`}>LIÊN HỆ</Link>
                        </nav>
                    </div>

                    {/* Mobile Hamburger Menu Toggle */}
                    <button
                        className="lg:hidden p-2 text-black"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
                    </button>
                </div>
            </div>

            {/* Mobile Navigation Menu */}
            <div className={`lg:hidden absolute top-full left-0 w-full bg-white border-b-4 border-[#1464F4] shadow-xl transform transition-transform duration-300 ease-in-out z-10 max-h-[calc(100vh-60px)] overflow-y-auto ${isMenuOpen ? 'translate-y-0' : '-translate-y-full'}`}>
                <nav className="flex flex-col py-2 px-6">
                    <div className="border-b border-gray-100">
                        <Link href="/" onClick={() => setIsMenuOpen(false)} className={`block py-4 ${getLinkClass('/')}`}>TRANG CHỦ</Link>
                    </div>

                    <div className="border-b border-gray-100">
                        <div className="flex items-center justify-between w-full">
                            <Link href="/products" onClick={() => setIsMenuOpen(false)} className={`${getLinkClass('/products')} flex-1 py-4 text-left`}>SẢN PHẨM</Link>
                            <button onClick={() => toggleSubmenu('products')} className="p-4 text-gray-600 focus:outline-none">
                                <ChevronDown size={18} className={`transform transition-transform ${mobileExpanded === 'products' ? 'rotate-180' : ''}`} />
                            </button>
                        </div>
                        <div className={`overflow-hidden transition-all duration-300 ${mobileExpanded === 'products' ? 'max-h-[1000px] pb-4' : 'max-h-0'}`}>
                            <div className="pl-4 flex flex-col gap-4">
                                {CATEGORIES.map(cat => (
                                    <div key={cat.id}>
                                        <div className="text-xs font-bold text-gray-400 mb-2 uppercase">{cat.label}</div>
                                        <div className="flex flex-col gap-3 pl-2">
                                            {products.filter(c => c.category === cat.id).map(car => (
                                                <Link key={car.id} href={`/products/${car.slug}`} onClick={() => setIsMenuOpen(false)} className="text-sm font-semibold text-gray-700 hover:text-[#1464F4]">
                                                    {car.name}
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="border-b border-gray-100">
                        <div className="flex items-center justify-between w-full">
                            <Link href="/services" onClick={() => setIsMenuOpen(false)} className={`${getLinkClass('/services')} flex-1 py-4 text-left`}>DỊCH VỤ</Link>
                            <button onClick={() => toggleSubmenu('services')} className="p-4 text-gray-600 focus:outline-none">
                                <ChevronDown size={18} className={`transform transition-transform ${mobileExpanded === 'services' ? 'rotate-180' : ''}`} />
                            </button>
                        </div>
                        <div className={`overflow-hidden transition-all duration-300 ${mobileExpanded === 'services' ? 'max-h-64 pb-4' : 'max-h-0'}`}>
                            <div className="pl-4 flex flex-col gap-4">
                                <Link href="/services" onClick={() => setIsMenuOpen(false)} className="text-sm font-semibold text-gray-700 hover:text-[#1464F4]">Đặt hẹn</Link>
                                <Link href="/services" onClick={() => setIsMenuOpen(false)} className="text-sm font-semibold text-gray-700 hover:text-[#1464F4]">Chăm sóc khách hàng</Link>
                                <Link href="/services" onClick={() => setIsMenuOpen(false)} className="text-sm font-semibold text-gray-700 hover:text-[#1464F4]">Quà tặng VinFast</Link>
                            </div>
                        </div>
                    </div>

                    <div className="border-b border-gray-100">
                        <div className="flex items-center justify-between w-full">
                            <Link href="/blog" onClick={() => setIsMenuOpen(false)} className={`${getLinkClass('/blog')} flex-1 py-4 text-left`}>TIN TỨC & KHUYẾN MÃI</Link>
                            <button onClick={() => toggleSubmenu('blog')} className="p-4 text-gray-600 focus:outline-none">
                                <ChevronDown size={18} className={`transform transition-transform ${mobileExpanded === 'blog' ? 'rotate-180' : ''}`} />
                            </button>
                        </div>
                        <div className={`overflow-hidden transition-all duration-300 ${mobileExpanded === 'blog' ? 'max-h-64 pb-4' : 'max-h-0'}`}>
                            <div className="pl-4 flex flex-col gap-4">
                                <Link href="/blog" onClick={() => setIsMenuOpen(false)} className="text-sm font-semibold text-gray-700 hover:text-[#1464F4]">Khuyến mãi kinh doanh</Link>
                                <Link href="/blog" onClick={() => setIsMenuOpen(false)} className="text-sm font-semibold text-gray-700 hover:text-[#1464F4]">Khuyến mãi dịch vụ</Link>
                                <Link href="/blog" onClick={() => setIsMenuOpen(false)} className="text-sm font-semibold text-gray-700 hover:text-[#1464F4]">Giấy phép môi trường</Link>
                            </div>
                        </div>
                    </div>

                    <div className="border-b border-gray-100">
                        <Link href="/tuyen-dung" onClick={() => setIsMenuOpen(false)} className={`block py-4 ${getLinkClass('/tuyen-dung')}`}>TUYỂN DỤNG</Link>
                    </div>

                    <div className="border-b border-gray-100">
                        <Link href="/contact" onClick={() => setIsMenuOpen(false)} className={`block py-4 ${getLinkClass('/contact')}`}>LIÊN HỆ</Link>
                    </div>

                    {/* Mobile Utilities */}
                    <div className="pt-6 pb-8 flex flex-col gap-4 text-sm text-gray-600">
                        <a href={settings?.link_gf_xanh_mekong || '#'} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-blue-600">
                            <img src="/logo_gf.webp" alt="GF Logo" className="h-4 w-auto object-contain" />
                            <span className="text-sm text-gray-600 transition-colors">Xanh Mekong</span>
                        </a>
                        <a href={settings?.link_xe_may_dien || '#'} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-blue-600">
                            <MapPin size={16} /> Ôtô điện Vinfast
                        </a>
                        <a href={settings?.link_share_vi_tri || settings?.google_maps_link || '#'} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-blue-600">
                            <Map size={16} /> Vị trí
                        </a>
                        <div className="flex items-center gap-4 pt-2">
                            <a href={settings?.facebook_link || '#'} target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-100 rounded-full" title="Theo dõi Fanpage Vinfast Xanh Mekong"><Facebook size={16} className="text-[#1877F2]" /></a>
                            <a href={settings?.tiktok_link || '#'} target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-100 rounded-full" title="Theo dõi TikTok Vinfast Xanh Mekong">
                                <svg fill="currentColor" viewBox="0 0 448 512" width="16" height="16" className="text-black">
                                    <path d="M448 209.91a210.06 210.06 0 0 1-122.77-39.25v178.72A162.55 162.55 0 1 1 185 188.31v89.89a74.62 74.62 0 1 0 52.23 71.18V0h88a121.18 121.18 0 0 0 1.86 22.17A122.18 122.18 0 0 0 381 102.39a121.43 121.43 0 0 0 67 20.14Z" />
                                </svg>
                            </a>
                            <a href={settings?.zalo_link || '#'} target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-100 rounded-full" title="Liên hệ Zalo Vinfast Xanh Mekong">
                                <img src="/zalo-icon.png" alt="Zalo" className="w-5 h-5 object-contain" />
                            </a>
                        </div>
                    </div>
                </nav>
            </div>
        </header>
    );
}
