import Image from 'next/image';
import Link from 'next/link';
import { supabase } from "@/lib/supabase";
import { Calendar, ArrowRight, Tag } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Chương Trình Khuyến Mãi & Ưu Đãi | VinFast Xanh Mekong',
    description: 'Tổng hợp các chương trình ưu đãi, tặng voucher và chính sách thuê pin mới nhất cho các dòng ôtô điện VinFast tại Cần Thơ.',
    alternates: {
        canonical: '/khuyen-mai',
    },
    openGraph: {
        title: 'Chương Trình Khuyến Mãi & Ưu Đãi | VinFast Xanh Mekong',
        description: 'Tổng hợp các chương trình ưu đãi, tặng voucher và chính sách thuê pin mới nhất cho các dòng ôtô điện VinFast tại Cần Thơ.',
        url: '/khuyen-mai',
        images: [{ url: '/logo-vinfast.jpg' }],
    }
};

export const revalidate = 60; // 60s cache update

interface PromotionDisplay {
    id: string;
    title: string;
    description: string;
    slug: string;
    start_date: string | null;
    end_date: string | null;
    banner_url: string | null;
    thumbnail_url: string | null;
}

export default async function PromotionsPage() {
    // Fetch active promotions ordered by created_at descending
    const { data: promotions } = await supabase
        .from('promotions')
        .select('id, title, description, slug, start_date, end_date, banner_url, thumbnail_url')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

    const activePromotions = (promotions as unknown as PromotionDisplay[]) || [];

    return (
        <div className="bg-vinfast-gray min-h-screen pb-20">
            {/* Page Header */}
            <div className="relative bg-gradient-to-r from-slate-900 via-[#121c2d] to-blue-950 text-white py-16 md:py-24 mb-12 overflow-hidden">
                <div className="absolute inset-0 bg-[url('/bg-vinfast-cars.webp')] bg-cover bg-center mix-blend-overlay opacity-90"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-[#121c2d]/85 to-blue-950/90"></div>

                {/* Faint Watermark Background */}
                <div className="absolute -bottom-10 right-0 z-0 pointer-events-none select-none overflow-hidden opacity-5">
                    <span className="text-[10rem] md:text-[15rem] font-black uppercase text-white leading-none whitespace-nowrap font-display">
                        VinFast
                    </span>
                </div>

                <div className="container relative z-10 mx-auto px-4 md:px-8 text-center max-w-4xl">
                    <div className="inline-flex items-center justify-center gap-2 bg-white/10 px-4 py-2 rounded-full mb-6 text-sm font-semibold tracking-wide uppercase backdrop-blur-sm border border-white/20 text-white">
                        <Tag size={16} /> Ưu Đãi Độc Quyền
                    </div>
                    <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight drop-shadow-md text-white">
                        Chương Trình Khuyến Mãi
                    </h1>
                    <p className="text-lg md:text-xl text-gray-300 leading-relaxed font-light">
                        Cập nhật các chính sách bán hàng mới nhất từ VinFast Xanh Mekong.
                        Cơ hội sở hữu ôtô điện thông minh với mức giá tốt nhất cùng hàng ngàn quà tặng hấp dẫn.
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 md:px-8">
                {activePromotions.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {activePromotions.map((promo) => {
                            // Render thumbnail_url, fall back to banner_url, then placeholder.webp
                            let imageUrl = promo.thumbnail_url || promo.banner_url || '/images/placeholder.webp';
                            if (imageUrl.startsWith('/') && !imageUrl.startsWith('/images/promotions/')) {
                                imageUrl = `/images/promotions/${imageUrl.split('/').pop()}`;
                            }

                            const startDate = promo.start_date ? new Date(promo.start_date).toLocaleDateString('vi-VN') : 'N/A';
                            const endDate = promo.end_date ? new Date(promo.end_date).toLocaleDateString('vi-VN') : 'nay';

                            return (
                                <Link
                                    href={`/khuyen-mai/${promo.slug}`}
                                    key={promo.id}
                                    className="block cursor-pointer bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group flex flex-col border border-gray-100"
                                >
                                    {/* Image Container with aspect-[1.91/1] to perfectly fit OG images without distortion */}
                                    <div className="relative w-full aspect-[1.91/1] overflow-hidden bg-gray-50">
                                        <Image
                                            src={imageUrl}
                                            alt={promo.title}
                                            fill
                                            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700 ease-in-out"
                                            unoptimized={!imageUrl.includes('unsplash')}
                                        />
                                    </div>

                                    {/* Content Area */}
                                    <div className="p-6 flex flex-col flex-grow">
                                        <span className="text-xs text-gray-400 font-semibold mb-2 flex items-center gap-1.5">
                                            <Calendar size={14} /> {startDate} - {endDate}
                                        </span>

                                        <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-vinfast-blue transition-colors line-clamp-2 font-display">
                                            {promo.title}
                                        </h3>

                                        <p className="text-gray-600 mb-6 flex-grow line-clamp-3 text-sm leading-relaxed">
                                            {promo.description ? promo.description.replace(/<[^>]*>/g, '') : ''}
                                        </p>

                                        {/* CTA Link Wrapper */}
                                        <div className="text-vinfast-blue text-sm font-bold tracking-wider uppercase flex items-center gap-2 mt-auto group-hover:text-blue-800 transition-colors">
                                            Xem chi tiết <ArrowRight size={16} className="transform group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                ) : (
                    // Empty State
                    <div className="max-w-2xl mx-auto text-center bg-white rounded-3xl shadow-sm border border-gray-100 p-12 md:p-16">
                        <div className="w-24 h-24 bg-blue-50 text-vinfast-blue rounded-full flex items-center justify-center mx-auto mb-6">
                            <Tag size={48} />
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                            Chưa có chương trình khuyến mãi mới
                        </h2>
                        <p className="text-gray-600 mb-8 text-lg">
                            Hiện tại các chương trình khuyến mãi đã kết thúc. Quý khách vui lòng để lại thông tin hoặc liên hệ trực tiếp Hotline để nhận báo giá và ưu đãi riêng tốt nhất.
                        </p>
                        <a
                            href="tel:0907697036"
                            className="inline-flex items-center justify-center gap-2 bg-vinfast-blue text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-blue-800 transition-colors shadow-lg hover:shadow-xl w-full md:w-auto"
                        >
                            Gọi Hotline: 0907 697 036
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}
