'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { ChevronLeft, ChevronRight, Check, Timer, Gauge, Zap, Battery, BatteryCharging, Weight, Ruler, Settings2, Car, Calculator, BadgePercent, FileText } from 'lucide-react';
import Image from 'next/image';
import ProductGallery from '@/components/client/product-gallery';
import ProductHeroActions from '@/components/client/product-hero-actions';
import { ProductDisplay } from '@/components/client/product-card';
import ScrollToTop from '@/components/client/scroll-to-top';
import { ModalWrapper, LeadFormModal, CostEstimateModal, InstallmentModal } from '@/components/client/quick-action-modals';
import dynamic from 'next/dynamic';

const ChargingNetwork = dynamic(() => import('@/components/shared/charging-network'), {
    loading: () => <div className="h-48 bg-gray-100 animate-pulse rounded-[2.5rem] container mx-auto px-4 md:px-8 mt-12" />,
    ssr: true,
});

const TechSpecsTable = dynamic(() => import('@/components/client/tech-specs-table'), {
    loading: () => <div className="h-96 bg-gray-150 animate-pulse rounded-[2.5rem] container mx-auto px-4 md:px-8 mt-12" />,
    ssr: true,
});

interface ProductDetailPageClientProps {
    product: any;
    similarProducts: ProductDisplay[];
}

export default function ProductDetailPageClient({ product, similarProducts }: ProductDetailPageClientProps) {
    const [activeModal, setActiveModal] = useState<'testDrive' | 'estimate' | 'installment' | 'quote' | null>(null);
    const [preFilledCar, setPreFilledCar] = useState('');
    const [preFilledNotes, setPreFilledNotes] = useState('');

    const handleCloseModal = () => {
        setActiveModal(null);
        setPreFilledCar('');
        setPreFilledNotes('');
    };

    const autoplayPlugin = React.useRef(Autoplay({ delay: 5000, stopOnInteraction: false }));
    const extraAutoplayPlugin = React.useRef(Autoplay({ delay: 5000, stopOnInteraction: false }));

    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [autoplayPlugin.current]);
    const [extraEmblaRef, extraEmblaApi] = useEmblaCarousel({ loop: true }, [extraAutoplayPlugin.current]);

    const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
    const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

    const scrollExtraPrev = useCallback(() => extraEmblaApi && extraEmblaApi.scrollPrev(), [extraEmblaApi]);
    const scrollExtraNext = useCallback(() => extraEmblaApi && extraEmblaApi.scrollNext(), [extraEmblaApi]);

    if (!product) return null;

    const hasFeatures = product?.features_carousel?.items?.length > 0;
    const extraHasFeatures = product?.extra_features_carousel?.items?.length > 0;

    const hasSingleVariant = product.variants && product.variants.length === 1;

    const formatPrice = (price: number) => price ? new Intl.NumberFormat('vi-VN').format(price) + ' VNĐ' : 'Liên hệ';
    const mainImageUrl = product?.thumbnail_url || `/images/products/${product?.slug}.webp`;
    const galleryImages = Array.from(new Set([mainImageUrl, ...(product?.gallery || [])])).filter(Boolean);
    const specs = product?.specs || {};

    const fullSpecs = [
        { label: 'Quãng đường', value: specs.range, icon: Timer },
        { label: 'Tăng tốc', value: specs.acceleration, icon: Gauge },
        { label: 'Dung lượng pin', value: specs.battery_capacity, icon: Battery },
        { label: 'Sạc nhanh', value: specs.fast_charge_time, icon: BatteryCharging },
        { label: 'Công suất', value: specs.max_power, icon: Zap },
        { label: 'Kích thước', value: specs.dimensions, icon: Ruler },
        { label: 'Hệ dẫn động', value: specs.drivetrain, icon: Settings2 },
    ].filter(s => s.value);

    return (
        <div className="bg-[#f7f8fa] min-h-screen pb-20">
            <ScrollToTop />

            {/* ━━━ HERO BANNER ━━━ */}
            <section className="relative w-full min-h-[50vh] md:min-h-[720px] flex flex-col justify-end items-center overflow-hidden">
                <Image
                    src={product?.hero_banner_url || mainImageUrl}
                    alt={product?.name || 'VinFast Hero'}
                    fill
                    priority={true}
                    fetchPriority="high"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
                    className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                <div className="relative z-10 w-full text-center pb-16 md:pb-24 px-4">
                    <h1 className="text-5xl md:text-8xl font-black text-white mb-2 tracking-tighter leading-tight">{product?.name}</h1>
                    {product?.subtitle && <p className="text-xl md:text-3xl text-blue-400 font-semibold uppercase tracking-widest mb-10 italic">{product?.subtitle}</p>}
                    <ProductHeroActions productName={product?.name} />
                </div>
            </section>

            {/* ━━━ OVERVIEW ━━━ */}
            <section className="container mx-auto px-4 md:px-8 -mt-12 relative z-20">
                <div className="bg-white rounded-[2.5rem] shadow-2xl p-6 md:p-12 border border-gray-100 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                    {/* Left Column: Synchronized Gallery */}
                    <div className="lg:col-span-7">
                        <ProductGallery images={galleryImages} productName={product?.name} />
                    </div>

                    {/* Right Column: Info & Policies */}
                    <div className="lg:col-span-5 flex flex-col gap-8">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-bold text-[#152B4D] mb-4 tracking-tight leading-tight">
                                {product?.name}
                            </h2>
                            <p className="text-gray-600 text-lg leading-relaxed text-justify">
                                {product?.excerpt || 'Khám phá sự kết hợp hoàn hảo giữa công nghệ hiện đại và thiết kế đẳng cấp từ VinFast.'}
                            </p>
                        </div>

                        {/* Divider */}
                        <div className="w-full h-px bg-gray-100" />

                        {/* Policies Section */}
                        <div className="flex flex-col gap-4">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-vinfast-blue opacity-50">Chính sách ưu đãi</h3>
                            <ul className="grid grid-cols-1 gap-4">
                                {(product?.policies || [
                                    'Bảo hành chính hãng 10 năm',
                                    'Cứu hộ miễn phí 24/7 toàn quốc',
                                    'Hệ thống trạm sạc phủ khắp 63 tỉnh thành',
                                    'Công nghệ ADAS thông minh vượt trội'
                                ]).map((item: string, i: number) => (
                                    <li key={i} className="flex items-center gap-4 text-gray-700 font-medium group">
                                        <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center shrink-0 group-hover:bg-vinfast-blue transition-colors">
                                            <Check size={16} className="text-vinfast-blue group-hover:text-white transition-colors" />
                                        </div>
                                        <span className="text-base leading-tight">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {hasSingleVariant && (
                            <div className="mt-8 p-6 bg-slate-50 border border-slate-100 rounded-2xl shadow-sm flex flex-col gap-1 transition-all hover:shadow-md">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-4 bg-vinfast-blue rounded-full"></div>
                                    <p className="text-xs md:text-sm font-semibold tracking-widest text-slate-500 uppercase">
                                        Giá bán niêm yết
                                    </p>
                                </div>
                                <p className="text-3xl md:text-4xl font-extrabold text-vinfast-blue tracking-tight mt-1">
                                    {product.variants[0].price ? product.variants[0].price.toLocaleString('vi-VN') : 'Liên hệ'}
                                    {product.variants[0].price && <span className="text-xl md:text-2xl text-slate-500 font-medium ml-2">VNĐ</span>}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* ━━━ VARIANTS & PRICING ━━━ */}
            {product?.variants && product.variants.length > 1 && (
                <section className="pt-24 pb-12 md:pt-32 md:pb-3">
                    <div className="container mx-auto px-4 md:px-8">
                        <div className="text-center mb-20">
                            <h2 className="text-2xl md:text-3xl font-extrabold uppercase tracking-wider mb-4 bg-gradient-to-r from-[#00358E] to-blue-400 bg-clip-text text-transparent">
                                Chọn {product.name} - {product.tagline || product.excerpt || 'TRẢI NGHIỆM ĐẲNG CẤP'}
                            </h2>
                            <p className="text-sm text-[#475569] tracking-[0.15em] uppercase mb-6">
                                Tìm kiếm phiên bản phản ánh chuẩn xác phong cách sống của bạn.
                            </p>
                            <div className="w-24 h-1.5 bg-[#00358E] mx-auto rounded-full shadow-sm" />
                        </div>

                        <div className="flex flex-wrap justify-center gap-6 md:gap-8 max-w-7xl mx-auto items-stretch">
                            {product?.variants?.map((v: any, i: number) => (
                                <div
                                    key={i}
                                    className={`relative group rounded-[2.5rem] p-10 flex flex-col h-full transition-all duration-700 hover:-translate-y-3 border flex-1 min-w-[300px] max-w-[400px] ${v.is_popular
                                        ? 'bg-[#00358E] text-white shadow-[0_35px_60px_-15px_rgba(0,53,142,0.45)] border-transparent'
                                        : 'bg-white text-[#152B4D] border-gray-200 shadow-lg'
                                        }`}
                                >
                                    {v.is_popular && (
                                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#00EDFF] text-black text-[10px] font-black px-8 py-2.5 rounded-full shadow-2xl uppercase tracking-[0.2em] z-10 whitespace-nowrap">
                                            Phổ biến nhất
                                        </div>
                                    )}

                                    {/* ─── Block A: Model Name + Note ─── */}
                                    <div className="flex-shrink-0">
                                        <h3 className={`text-2xl md:text-3xl font-black uppercase tracking-tight leading-tight ${v.is_popular ? 'text-white' : 'text-[#152B4D]'}`}>
                                            {v.name}
                                        </h3>
                                        {(v.note || v.description) && (
                                            <p className={`text-sm mt-1 font-light italic ${v.is_popular ? 'text-slate-200' : 'text-[#475569]'}`}>
                                                ({v.note || v.description})
                                            </p>
                                        )}
                                    </div>

                                    {/* ─── Block B: Horizontal Separator ─── */}
                                    <div className={`my-8 border-t ${v.is_popular ? 'border-white/15' : 'border-[#e2e8f0]'}`} />

                                    {/* ─── Block C: Pricing ─── */}
                                    <div className="mt-auto">
                                        <span className={`text-[9px] font-black uppercase tracking-widest block mb-3 ${v.is_popular ? 'text-cyan-100/50' : 'text-gray-500'}`}>
                                            Giá bán từ
                                        </span>
                                        <div className={`text-3xl md:text-4xl font-black tracking-tighter leading-none ${v.is_popular ? 'text-white' : 'text-vinfast-blue'}`}>
                                            {formatPrice(v.price)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ━━━ ACTIONS ━━━ */}
            <section className=" pt-8 pb-20 md:pt-8 md:pb-28">
                <div className="container mx-auto px-4 md:px-8">
                    {/* Section Intro */}
                    <div className="text-center mb-16">
                        <h2 className="text-xl md:text-2xl font-extrabold uppercase tracking-wider mb-3 bg-gradient-to-r from-[#00358E] to-blue-400 bg-clip-text text-transparent">
                            Đặc Quyền Sở Hữu - Trải Nghiệm Đẳng Cấp
                        </h2>
                        <p className="text-xs font-black uppercase tracking-[0.3em] text-[#475569]">
                            Mọi thứ bạn cần để bắt đầu hành trình cùng VinFast
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
                        {/* Card 1: Lái Thử */}
                        <button
                            onClick={() => setActiveModal('testDrive')}
                            className="group bg-white rounded-[2rem] p-8 flex flex-col items-center text-center h-full border border-gray-100 shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                        >
                            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-vinfast-blue transition-colors duration-300">
                                <Car size={24} className="text-vinfast-blue group-hover:text-white transition-colors duration-300" />
                            </div>
                            <h3 className="text-base font-extrabold uppercase tracking-[0.15em] text-vinfast-blue mb-3">Đăng Ký Lái Thử</h3>
                            <p className="text-sm text-[#475569] leading-relaxed flex-grow">
                                Trải nghiệm thực tế cảm giác lái mượt mà của các dòng xe điện VinFast.
                            </p>
                            <span className="mt-6 text-xs font-black text-vinfast-blue uppercase tracking-widest group-hover:gap-2 flex items-center gap-1 transition-all">
                                Khám phá ngay <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
                            </span>
                        </button>

                        {/* Card 2: Dự Toán */}
                        <button
                            onClick={() => setActiveModal('estimate')}
                            className="group bg-white rounded-[2rem] p-8 flex flex-col items-center text-center h-full border border-gray-100 shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                        >
                            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-vinfast-blue transition-colors duration-300">
                                <Calculator size={24} className="text-vinfast-blue group-hover:text-white transition-colors duration-300" />
                            </div>
                            <h3 className="text-base font-extrabold uppercase tracking-[0.15em] text-vinfast-blue mb-3">Dự Toán Chi Phí</h3>
                            <p className="text-sm text-[#475569] leading-relaxed flex-grow">
                                Nhập thông tin để nhận bảng tính chi phí lăn bánh chính xác nhất.
                            </p>
                            <span className="mt-6 text-xs font-black text-vinfast-blue uppercase tracking-widest flex items-center gap-1">
                                Khám phá ngay <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
                            </span>
                        </button>

                        {/* Card 3: Trả Góp */}
                        <button
                            onClick={() => setActiveModal('installment')}
                            className="group bg-white rounded-[2rem] p-8 flex flex-col items-center text-center h-full border border-gray-100 shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                        >
                            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-vinfast-blue transition-colors duration-300">
                                <BadgePercent size={24} className="text-vinfast-blue group-hover:text-white transition-colors duration-300" />
                            </div>
                            <h3 className="text-base font-extrabold uppercase tracking-[0.15em] text-vinfast-blue mb-3">Chi Phí Trả Góp</h3>
                            <p className="text-sm text-[#475569] leading-relaxed flex-grow">
                                VinFast hỗ trợ vay tối đa 80% giá trị xe, cùng chương trình ưu đãi trả góp hấp dẫn.
                            </p>
                            <span className="mt-6 text-xs font-black text-vinfast-blue uppercase tracking-widest flex items-center gap-1">
                                Khám phá ngay <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
                            </span>
                        </button>

                        {/* Card 4: Báo Giá */}
                        <button
                            onClick={() => setActiveModal('quote')}
                            className="group bg-white rounded-[2rem] p-8 flex flex-col items-center text-center h-full border border-gray-100 shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                        >
                            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-vinfast-blue transition-colors duration-300">
                                <FileText size={24} className="text-vinfast-blue group-hover:text-white transition-colors duration-300" />
                            </div>
                            <h3 className="text-base font-extrabold uppercase tracking-[0.15em] text-vinfast-blue mb-3">Báo Giá Xe</h3>
                            <p className="text-sm text-[#475569] leading-relaxed flex-grow">
                                Nhận báo giá nhanh chóng và chi tiết các gói ưu đãi khuyến mãi ngay hôm nay.
                            </p>
                            <span className="mt-6 text-xs font-black text-vinfast-blue uppercase tracking-widest flex items-center gap-1">
                                Khám phá ngay <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
                            </span>
                        </button>
                    </div>
                </div>
            </section>

            <hr className="w-[300px] mx-auto border-t-2 border-gray-400" />

            {/* ━━━ FEATURES CAROUSEL ━━━ */}
            {hasFeatures && (
                <section className="py-20 md:py-28">
                    <div className="container mx-auto px-4 md:px-8">
                        {/* Dynamic Section Title */}
                        {product?.features_carousel?.title && (
                            <div className="text-center mb-10">
                                <h2 className="text-3xl font-bold uppercase text-vinfast-blue">
                                    {product.features_carousel.title}
                                </h2>
                                {(product.features_carousel.description || product.features_carousel.discription) && (
                                    <p className="text-gray-600 text-base md:text-lg max-w-3xl mx-auto mt-4 leading-relaxed">
                                        {product.features_carousel.description || product.features_carousel.discription}
                                    </p>
                                )}
                                <hr className="w-24 h-1 mx-auto bg-vinfast-blue border-0 mt-6" />
                            </div>
                        )}

                        {/* Embla Carousel */}
                        <div className="relative group">
                            <div className="overflow-hidden rounded-[2.5rem] shadow-2xl border border-gray-100" ref={emblaRef}>
                                <div className="flex">
                                    {product?.features_carousel?.items?.map((item: any, i: number) => (
                                        <div key={i} className="flex-[0_0_100%] min-w-0 relative aspect-video">
                                            {item?.url && <Image src={item.url} alt={product.features_carousel.title || 'Feature'} fill sizes="(max-width: 1024px) 100vw, 80vw" className="object-cover" />}
                                            <div className="absolute bottom-0 left-0 right-0 h-[28%] bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-end justify-center pb-6 md:pb-8 px-6 text-center">
                                                <p className="text-white text-base md:text-2xl font-bold drop-shadow-lg">{item.text}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <button onClick={scrollPrev} aria-label="Ảnh tính năng trước" className="absolute left-4 md:left-10 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity"><ChevronLeft className="text-white" /></button>
                            <button onClick={scrollNext} aria-label="Ảnh tính năng tiếp theo" className="absolute right-4 md:right-10 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity"><ChevronRight className="text-white" /></button>
                        </div>
                    </div>
                </section>
            )}

            {/* ━━━ MAGAZINE STYLE FEATURES ━━━ */}
            {product?.feature_sections?.map((section: any, sIdx: number) => (
                <section key={sIdx} className="py-20 md:py-28">
                    <div className="mx-auto container px-4 md:px-8">
                        {/* Section-level heading */}
                        {section?.title && (
                            <div className="mb-16">
                                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-wider leading-tight text-[#152B4D] mb-8">
                                    {section.title}
                                </h2>
                                <div className="w-16 h-1.5 bg-[#00358E] rounded-full" />
                            </div>
                        )}
                        {/* Items */}
                        <div className="flex flex-col gap-24">
                            {section?.items?.map((item: any, iIdx: number) => (
                                <div key={iIdx} className="flex flex-col gap-10 w-full">
                                    {item?.text && (
                                        <p className="text-gray-700 text-lg leading-relaxed text-justify">
                                            {item.text}
                                        </p>
                                    )}
                                    {item?.url && (
                                        <div className="w-full rounded-[2.5rem] overflow-hidden shadow-2xl relative aspect-video">
                                            {item.url.match(/\.(mp4|webm|mov)$/) ? (
                                                <video src={item.url} className="w-full h-auto" autoPlay muted loop playsInline />
                                            ) : (
                                                <Image
                                                    src={item.url}
                                                    alt={section.title || 'Feature'}
                                                    fill
                                                    sizes="(max-width: 1024px) 100vw, 80vw"
                                                    className="object-cover"
                                                />
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            ))}

            {/* ━━━ EXTRA FEATURES CAROUSEL ━━━ */}
            {extraHasFeatures && (
                <section className="py-20 md:py-28">
                    <div className="container mx-auto px-4 md:px-8">
                        {/* Dynamic Section Title */}
                        {product?.extra_features_carousel?.title && (
                            <div className="text-center mb-10">
                                <h2 className="text-3xl font-bold uppercase text-vinfast-blue">
                                    {product.extra_features_carousel.title}
                                </h2>
                                {(product.extra_features_carousel.description || product.extra_features_carousel.discription) && (
                                    <p className="text-gray-600 text-base md:text-lg max-w-3xl mx-auto mt-4 leading-relaxed">
                                        {product.extra_features_carousel.description || product.extra_features_carousel.discription}
                                    </p>
                                )}
                                <hr className="w-24 h-1 mx-auto bg-vinfast-blue border-0 mt-6" />
                            </div>
                        )}

                        {/* Embla Carousel */}
                        <div className="relative group">
                            <div className="overflow-hidden rounded-[2.5rem] shadow-2xl border border-gray-100" ref={extraEmblaRef}>
                                <div className="flex">
                                    {product?.extra_features_carousel?.items?.map((item: any, i: number) => (
                                        <div key={i} className="flex-[0_0_100%] min-w-0 relative aspect-video">
                                            {item?.url && <Image src={item.url} alt={product.extra_features_carousel.title || 'Feature'} fill sizes="(max-width: 1024px) 100vw, 80vw" className="object-cover" />}
                                            <div className="absolute bottom-0 left-0 right-0 h-[28%] bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-end justify-center pb-6 md:pb-8 px-6 text-center">
                                                <p className="text-white text-base md:text-2xl font-bold drop-shadow-lg">{item.text}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <button onClick={scrollExtraPrev} aria-label="Ảnh tính năng bổ sung trước" className="absolute left-4 md:left-10 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity"><ChevronLeft className="text-white" /></button>
                            <button onClick={scrollExtraNext} aria-label="Ảnh tính năng bổ sung tiếp theo" className="absolute right-4 md:right-10 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity"><ChevronRight className="text-white" /></button>
                        </div>
                    </div>
                </section>
            )}

            {/* ━━━ EXTRA FEATURES (MAGAZINE) ━━━ */}
            {product?.extra_feature_sections?.map((section: any, sIdx: number) => (
                <section key={sIdx} className="py-20 md:py-28">
                    <div className="container mx-auto px-4 md:px-8">
                        {/* Section-level heading */}
                        {section?.title && (
                            <div className="mb-16">
                                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-[#152B4D] mb-4">
                                    {section.title}
                                </h2>
                                <div className="w-16 h-1.5 bg-[#00358E] rounded-full" />
                            </div>
                        )}
                        {/* Items */}
                        <div className="flex flex-col gap-24">
                            {section?.items?.map((item: any, iIdx: number) => (
                                <div key={iIdx} className="flex flex-col gap-10 w-full">
                                    {item?.text && (
                                        <p className="text-gray-700 text-lg leading-relaxed text-justify">
                                            {item.text}
                                        </p>
                                    )}
                                    {item?.url && (
                                        <div className="w-full rounded-[2.5rem] overflow-hidden shadow-2xl relative aspect-video">
                                            {item.url.match(/\.(mp4|webm|mov)$/) ? (
                                                <video src={item.url} className="w-full h-auto" autoPlay muted loop playsInline />
                                            ) : (
                                                <Image
                                                    src={item.url}
                                                    alt={section.title || 'Feature'}
                                                    fill
                                                    sizes="(max-width: 1024px) 100vw, 80vw"
                                                    className="object-cover"
                                                />
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            ))}

            {/* ━━━ ADVANCED DYNAMIC BLOCKS ━━━ */}
            {product?.advanced_features_blocks && product.advanced_features_blocks.length > 0 && (
                <section className="py-20 md:py-28 bg-white border-t border-b border-gray-100">
                    <div className="container mx-auto px-4 md:px-8 max-w-7xl">
                        <div className="text-center mb-16 md:mb-24">
                            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-[#152B4D] mb-4">
                                {product?.advanced_features_title || 'TÍNH NĂNG NÂNG CAO'}
                            </h2>
                            {product.advanced_features_desc && (
                                <p className="text-gray-600 text-base md:text-lg max-w-3xl mx-auto leading-relaxed">
                                    {product.advanced_features_desc}
                                </p>
                            )}
                            <div className="w-24 h-1.5 bg-[#00358E] mx-auto rounded-full mt-6" />
                        </div>

                        <div className="space-y-16 md:space-y-24">
                            {product.advanced_features_blocks.map((block: any, idx: number) => {
                                switch (block.type) {
                                    case 'hero_full':
                                        return (
                                            <div key={idx} className="relative w-full rounded-[2rem] overflow-hidden shadow-xl group">
                                                <div className="relative aspect-video md:aspect-[21/9] w-full bg-slate-100">
                                                    {block.image_url ? (
                                                        <Image
                                                            src={block.image_url}
                                                            alt={block.title || 'Advanced feature'}
                                                            fill
                                                            sizes="100vw"
                                                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                                                            No Image
                                                        </div>
                                                    )}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex flex-col justify-end p-6 md:p-12" />
                                                </div>
                                                <div className="bg-white p-6 md:p-10 border border-t-0 border-gray-100 rounded-b-[2rem]">
                                                    <h3 className="text-2xl md:text-3xl font-bold text-[#152B4D] mb-4 tracking-tight">
                                                        {block.title}
                                                    </h3>
                                                    {block.description && (
                                                        <p className="text-gray-600 text-base md:text-lg leading-relaxed text-justify whitespace-pre-line">
                                                            {block.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        );

                                    case 'split_left':
                                        return (
                                            <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
                                                <div className="relative aspect-video md:aspect-[4/3] w-full rounded-[2rem] overflow-hidden shadow-xl bg-slate-100">
                                                    {block.image_url ? (
                                                        <Image
                                                            src={block.image_url}
                                                            alt={block.title || 'Advanced feature'}
                                                            fill
                                                            sizes="(max-width: 768px) 100vw, 50vw"
                                                            className="object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                                                            No Image
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="space-y-4 px-2">
                                                    <h3 className="text-2xl md:text-3xl font-bold text-[#152B4D] tracking-tight">
                                                        {block.title}
                                                    </h3>
                                                    {block.description && (
                                                        <p className="text-gray-600 text-base md:text-lg leading-relaxed text-justify whitespace-pre-line">
                                                            {block.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        );

                                    case 'split_right':
                                        return (
                                            <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
                                                <div className="md:order-last relative aspect-video md:aspect-[4/3] w-full rounded-[2rem] overflow-hidden shadow-xl bg-slate-100">
                                                    {block.image_url ? (
                                                        <Image
                                                            src={block.image_url}
                                                            alt={block.title || 'Advanced feature'}
                                                            fill
                                                            sizes="(max-width: 768px) 100vw, 50vw"
                                                            className="object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                                                            No Image
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="space-y-4 px-2">
                                                    <h3 className="text-2xl md:text-3xl font-bold text-[#152B4D] tracking-tight">
                                                        {block.title}
                                                    </h3>
                                                    {block.description && (
                                                        <p className="text-gray-600 text-base md:text-lg leading-relaxed text-justify whitespace-pre-line">
                                                            {block.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        );

                                    case 'grid_2':
                                        return (
                                            <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                                                {(block.items || []).slice(0, 2).map((item: any, subIdx: number) => {
                                                    const textBlock = (
                                                        <div key="text" className="space-y-3 px-2 flex-grow">
                                                            <h4 className="text-xl md:text-2xl font-bold text-[#152B4D] tracking-tight">
                                                                {item.title}
                                                            </h4>
                                                            {item.description && (
                                                                <p className="text-gray-600 text-sm md:text-base leading-relaxed text-justify whitespace-pre-line">
                                                                    {item.description}
                                                                </p>
                                                            )}
                                                        </div>
                                                    );

                                                    const imageBlock = (
                                                        <div key="image" className="relative aspect-video md:aspect-[16/10] w-full rounded-2xl overflow-hidden shadow-md bg-slate-50 shrink-0">
                                                            {item.image_url ? (
                                                                <Image
                                                                    src={item.image_url}
                                                                    alt={item.title || 'Grid 2 feature'}
                                                                    fill
                                                                    sizes="(max-width: 768px) 100vw, 50vw"
                                                                    className="object-cover"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                                                                    No Image
                                                                </div>
                                                            )}
                                                        </div>
                                                    );

                                                    return (
                                                        <div key={subIdx} className="flex flex-col gap-4 h-full">
                                                            {item.layout_style === 'text_top' ? (
                                                                <>
                                                                    {textBlock}
                                                                    {imageBlock}
                                                                </>
                                                            ) : (
                                                                <>
                                                                    {imageBlock}
                                                                    {textBlock}
                                                                </>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );

                                    case 'grid_4':
                                        return (
                                            <div key={idx} className="space-y-8">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                                                    {block.items?.map((subItem: any, subIdx: number) => (
                                                        <div key={subIdx} className="bg-slate-50 border border-slate-100 rounded-[2rem] p-6 flex flex-col h-full hover:shadow-lg transition-all duration-300">
                                                            <div className="relative w-full aspect-[16/10] mb-6 rounded-2xl overflow-hidden bg-white shadow-sm flex items-center justify-center shrink-0">
                                                                {subItem.image_url ? (
                                                                    <Image
                                                                        src={subItem.image_url}
                                                                        alt={subItem.title || 'Sub feature'}
                                                                        fill
                                                                        sizes="(max-width: 768px) 100vw, 25vw"
                                                                        className="object-cover"
                                                                    />
                                                                ) : (
                                                                    <div className="text-slate-300 font-medium text-xs">No Icon</div>
                                                                )}
                                                            </div>
                                                            <h4 className="text-lg font-bold text-[#152B4D] mb-2 tracking-tight">
                                                                {subItem.title}
                                                            </h4>
                                                            <p className="text-gray-500 text-sm leading-relaxed flex-grow text-justify whitespace-pre-line">
                                                                {subItem.description}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );

                                    default:
                                        return null;
                                }
                            })}
                        </div>
                    </div>
                </section>
            )}

            {product?.tech_specs_markdown && <TechSpecsTable markdown={product.tech_specs_markdown} productName={product.name} onQuoteClick={() => setActiveModal('quote')} brochureUrl={product.brochure_url} />}

            <ChargingNetwork />

            {/* ━━━ POPULAR MODELS (DISCOVERY) ━━━ */}
            <section className="bg-white pt-24 md:py-32 border-t border-gray-100 overflow-hidden">
                <div className="container mx-auto px-4 md:px-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
                        <div>
                            <h2 className="text-3xl md:text-5xl font-black text-[#152B4D] mb-4 tracking-tighter uppercase italic">
                                CÁC DÒNG XE PHỔ BIẾN
                            </h2>
                            <p className="text-blue-600 font-bold uppercase tracking-[0.2em] text-sm md:text-base">
                                Khám phá hệ sinh thái xe điện VinFast
                            </p>
                        </div>
                        <div className="hidden md:block w-32 h-2 bg-vinfast-blue/10 rounded-full mb-2" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                        {similarProducts?.filter(p => p.slug !== product?.slug).slice(0, 4).map((p, i) => (
                            <Link key={p.id} href={`/products/${p.slug}`} className="group relative block h-full">
                                <div className="bg-[#f8f9fb] rounded-[2.5rem] p-10 h-full flex flex-col items-center text-center transition-all duration-700 hover:shadow-[0_40px_80px_-20px_rgba(0,53,142,0.15)] hover:-translate-y-6 border border-transparent hover:border-blue-100 overflow-hidden relative">
                                    {/* Glossy Metallic Effect Background */}
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/40 to-transparent rounded-full -mr-16 -mt-16 blur-2xl" />

                                    <div className="relative w-full aspect-[16/10] mb-10 transition-all duration-700 group-hover:scale-110 group-hover:rotate-1">
                                        <Image
                                            src={p.thumbnail_url || `/images/products/${p.slug}.webp`}
                                            alt={p.name}
                                            fill
                                            sizes="(max-width: 768px) 100vw, 25vw"
                                            className="object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.1)]"
                                        />
                                    </div>

                                    <h3 className="text-2xl font-black text-[#152B4D] group-hover:text-vinfast-blue transition-colors mb-3 tracking-tight">
                                        {p.name}
                                    </h3>

                                    <p className="text-vinfast-blue font-black text-lg mb-10">
                                        Giá từ: {p.price_from ? new Intl.NumberFormat('vi-VN').format(p.price_from) + ' VNĐ' : 'Liên hệ'}
                                    </p>

                                    <div className="mt-auto opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-6 group-hover:translate-y-0">
                                        <div className="px-10 py-4 bg-[#1464F4] text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-blue-500/40">
                                            Xem chi tiết
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            <ModalWrapper isOpen={activeModal !== null} onClose={handleCloseModal}>
                {activeModal === 'testDrive' && (
                    <LeadFormModal 
                        title={`Lái Thử ${preFilledCar || product?.name}`} 
                        onClose={handleCloseModal} 
                        selectedCar={preFilledCar || product?.name} 
                        initialNotes={preFilledNotes}
                    />
                )}
                {activeModal === 'estimate' && (
                    <CostEstimateModal 
                        onQuoteTrigger={(carName, notes) => {
                            setPreFilledCar(carName);
                            setPreFilledNotes(notes);
                            setActiveModal('quote');
                        }}
                    />
                )}
                {activeModal === 'installment' && (
                    <InstallmentModal 
                        onQuoteTrigger={(carName, notes) => {
                            setPreFilledCar(carName);
                            setPreFilledNotes(notes);
                            setActiveModal('quote');
                        }}
                    />
                )}
                {activeModal === 'quote' && (
                    <LeadFormModal 
                        title={`Báo Giá ${preFilledCar || product?.name}`} 
                        onClose={handleCloseModal} 
                        selectedCar={preFilledCar || product?.name} 
                        initialNotes={preFilledNotes}
                    />
                )}
            </ModalWrapper>
        </div>
    );
}
