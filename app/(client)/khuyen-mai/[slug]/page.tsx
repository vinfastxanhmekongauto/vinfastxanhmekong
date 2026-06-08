import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { Calendar, Tag, Gift, Phone } from 'lucide-react';
import PromotionLeadForm from '@/components/client/promotion-lead-form';
import ShareButton from '@/components/ui/share-button';
import { SITE_URL } from '@/lib/constants';

export const revalidate = 60; // Cache 60s

interface PromotionDetailPageProps {
    params: Promise<{
        slug: string;
    }>
}

export async function generateMetadata({ params }: PromotionDetailPageProps): Promise<Metadata> {
    const { slug } = await params;
    const { data: promotion } = await supabase
        .from('promotions')
        .select(`
            *,
            banner_url
        `)
        .eq('slug', slug)
        .single();

    if (!promotion) return { title: 'Khuyến mãi không tồn tại' };

    let imageUrl = promotion.banner_url || `${SITE_URL}/images/promotions/${promotion.slug}.webp`;
    if (imageUrl.startsWith('/') && !imageUrl.startsWith('http')) {
        imageUrl = `${SITE_URL}${imageUrl}`;
    }

    // Clean description for metadata
    const cleanDesc = promotion.description
        ? promotion.description.substring(0, 160).replace(/<[^>]*>/g, '').replace(/\n/g, ' ')
        : 'Chương trình ưu đãi hấp dẫn từ VinFast Xanh Mekong.';

    return {
        title: `${promotion.title} | VinFast Xanh Mekong`,
        description: cleanDesc,
        alternates: {
            canonical: `/khuyen-mai/${promotion.slug}`,
        },
        openGraph: {
            title: promotion.title,
            description: cleanDesc,
            url: `${SITE_URL}/khuyen-mai/${promotion.slug}`,
            siteName: 'VinFast Xanh Mekong',
            images: [
                {
                    url: imageUrl,
                    width: 1200,
                    height: 630,
                    alt: promotion.title,
                },
            ],
            locale: 'vi_VN',
            type: 'article',
        },
    };
}

export default async function PromotionDetailPage({ params }: PromotionDetailPageProps) {
    const { slug } = await params;

    // Fetch Promotion with Media
    const { data: promotion, error } = await supabase
        .from('promotions')
        .select(`
            *,
            banner_url,
            mobile_url
        `)
        .eq('slug', slug)
        .single();

    if (error || !promotion) {
        notFound();
    }

    // Process Promotion Images
    const getFullUrl = (url: string | undefined, slug: string) => {
        if (!url) return `/images/promotions/${slug}.webp`;
        let processed = url;
        if (processed.startsWith('/') && !processed.startsWith('/images/promotions/')) {
            processed = `/images/promotions/${processed.split('/').pop()}`;
        }
        return processed;
    };

    const desktopImageUrl = getFullUrl(promotion.banner_url, promotion.slug);
    const mobileImageUrl = getFullUrl(promotion.mobile_url || promotion.banner_url, promotion.slug);

    let absoluteDesktopUrl = desktopImageUrl;
    if (absoluteDesktopUrl.startsWith('/') && !absoluteDesktopUrl.startsWith('http')) {
        absoluteDesktopUrl = `${SITE_URL}${absoluteDesktopUrl}`;
    }

    let absoluteMobileUrl = mobileImageUrl;
    if (absoluteMobileUrl.startsWith('/') && !absoluteMobileUrl.startsWith('http')) {
        absoluteMobileUrl = `${SITE_URL}${absoluteMobileUrl}`;
    }

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": promotion.title,
        "image": [absoluteDesktopUrl, absoluteMobileUrl],
        "datePublished": promotion.start_date || promotion.created_at,
        "dateModified": promotion.updated_at || promotion.created_at || promotion.start_date,
        "author": {
            "@type": "Organization",
            "name": "VinFast Xanh Mekong"
        },
        "publisher": {
            "@type": "Organization",
            "name": "VinFast Xanh Mekong",
            "logo": {
                "@type": "ImageObject",
                "url": `${SITE_URL}/logo.png`
            }
        }
    };

    const startDate = new Date(promotion.start_date).toLocaleDateString('vi-VN');
    const endDate = new Date(promotion.end_date).toLocaleDateString('vi-VN');

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <div className="bg-vinfast-gray min-h-screen pb-32 md:pb-20">
            {/* 1. Hero Banner Section - No Crop, Responsive */}
            <div className="bg-white border-b border-gray-200">
                <div className="container mx-auto px-0 md:px-8 py-0 md:py-8 lg:py-12">
                    <div className="relative w-full h-auto overflow-hidden md:rounded-3xl shadow-sm border-0 md:border border-gray-100 bg-gray-50">
                        {/* Desktop Image */}
                        <Image
                            src={desktopImageUrl}
                            alt={promotion.title}
                            width={2000}
                            height={857}
                            className="hidden md:block w-full h-auto object-contain"
                            unoptimized
                            priority
                        />
                        {/* Mobile Image */}
                        <Image
                            src={mobileImageUrl}
                            alt={promotion.title}
                            width={1000}
                            height={1333}
                            className="block md:hidden w-full h-auto object-contain"
                            unoptimized
                            priority
                        />
                        
                        <div className="absolute top-4 left-4 md:top-8 md:left-8 bg-red-600 text-white px-4 py-1.5 md:px-6 md:py-2 rounded-full text-xs md:text-sm font-bold shadow-lg uppercase tracking-wider flex items-center gap-2 z-10">
                            <Gift size={16} /> Đang Diễn Ra
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Content & Form Split Layout */}
            <div className="container mx-auto px-4 md:px-8 mt-8 md:mt-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">

                    {/* LEFT: Main Promotion Content */}
                    <div className="lg:col-span-2 space-y-8 bg-white p-6 md:p-12 rounded-3xl shadow-sm border border-gray-100 flex-grow animate-fade-in-up flow-root">
                        <div className="inline-flex items-center gap-2 text-vinfast-blue font-semibold bg-blue-50 px-3 py-1.5 rounded-lg text-sm border border-blue-100">
                            <Tag size={16} /> Tin Khuyến Mãi
                        </div>

                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 leading-tight tracking-tight mt-4">
                            {promotion.title}
                        </h1>

                        <div className="flex flex-wrap items-center gap-3 text-sm md:text-base text-gray-700 bg-gray-50 border border-gray-200 py-3 px-5 rounded-xl font-medium shadow-sm w-fit mt-6">
                            <Calendar size={20} className="text-vinfast-blue" />
                            <span>Thời gian áp dụng: <span className="text-red-600 font-bold">{startDate} - {endDate}</span></span>
                        </div>

                        {promotion.description ? (
                            <div className="prose prose-lg max-w-none prose-img:rounded-xl prose-img:w-full mt-10 flow-root" dangerouslySetInnerHTML={{ __html: promotion.description }} />
                        ) : (
                            <p className="text-gray-500 mt-10">Đang cập nhật nội dung chi tiết cho chương trình khuyến mãi này. Vui lòng liên hệ Hotline để biết thêm chi tiết.</p>
                        )}

                        {/* Desktop sharing row */}
                        <div className="hidden md:flex items-center gap-4 pt-8 border-t border-gray-100 mt-10">
                            <span className="font-semibold text-gray-700">Chia sẻ ưu đãi:</span>
                            <ShareButton />
                        </div>
                    </div>

                    {/* RIGHT: Lead Form Integration */}
                    <div className="lg:col-span-1" id="lead-form-section">
                        <div className="sticky top-24">
                            <PromotionLeadForm promotionTitle={promotion.title} />
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Mobile Sticky Action Bar */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex items-center gap-3 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-40">
                <ShareButton variant="full" />
                <a href="tel:0907697036" className="flex-[2] bg-vinfast-blue text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg active:bg-blue-800">
                    <Phone size={20} className="animate-pulse" /> Hotline Ngay
                </a>
            </div>
        </div>
        </>
    );
}
