import Image from 'next/image';
import Link from 'next/link';
import { supabase } from "@/lib/supabase";
import { Calendar, ArrowRight, Tag } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Chương Trình Khuyến Mãi & Ưu Đãi | VinFast Xanh Mekong',
    description: 'Tổng hợp các chương trình ưu đãi, tặng voucher và chính sách thuê pin mới nhất cho các dòng ôtô điện VinFast tại Cần Thơ.',
    openGraph: {
        title: 'Chương Trình Khuyến Mãi & Ưu Đãi | VinFast Xanh Mekong',
        description: 'Tổng hợp các chương trình ưu đãi, tặng voucher và chính sách thuê pin mới nhất cho các dòng ôtô điện VinFast tại Cần Thơ.',
        url: '/promotions',
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
}

export default async function PromotionsPage() {
    const today = new Date().toISOString();

    // Fetch Danh sách khuyến mãi đang diễn ra (is_active = true VÀ end_date >= today)
    const { data: promotions } = await supabase
        .from('promotions')
        .select(`
            id, title, description, slug, start_date, end_date,
            banner_url
        `)
        .eq('is_active', true)
        .gte('end_date', today)
        .order('start_date', { ascending: false });

    const activePromotions = (promotions as unknown as PromotionDisplay[]) || [];

    return (
        <div className="bg-vinfast-gray min-h-screen pb-20">
            {/* Page Header */}
            <div className="bg-vinfast-blue text-white py-16 md:py-24 mb-12 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&q=80&w=2000')] opacity-20 bg-cover bg-center mix-blend-overlay"></div>
                <div className="container relative z-10 mx-auto px-4 md:px-8 text-center max-w-4xl">
                    <div className="inline-flex items-center justify-center gap-2 bg-white/20 px-4 py-2 rounded-full mb-6 text-sm font-semibold tracking-wide uppercase backdrop-blur-sm border border-white/30">
                        <Tag size={16} /> Ưu Đãi Độc Quyền
                    </div>
                    <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight drop-shadow-md">
                        Chương Trình Khuyến Mãi
                    </h1>
                    <p className="text-lg md:text-xl text-blue-100 leading-relaxed font-light">
                        Cập nhật các chính sách bán hàng mới nhất từ VinFast Xanh Mekong.
                        Cơ hội sở hữu ôtô điện thông minh với mức giá tốt nhất cùng hàng ngàn quà tặng hấp dẫn.
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 md:px-8">
                {activePromotions.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                        {activePromotions.map((promo) => {
                            let imageUrl = promo.banner_url || '/images/placeholder.webp';
                            if (imageUrl.startsWith('/') && !imageUrl.startsWith('/images/promotions/')) {
                                imageUrl = `/images/promotions/${imageUrl.split('/').pop()}`; // Fallback logic assuming banners are in products for now
                            }

                            const startDate = promo.start_date ? new Date(promo.start_date).toLocaleDateString('vi-VN') : 'N/A';
                            const endDate = promo.end_date ? new Date(promo.end_date).toLocaleDateString('vi-VN') : 'nay';

                            return (
                                <Link href={`/promotions/${promo.slug}`} key={promo.id} className="block cursor-pointer bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group flex flex-col border border-gray-100">
                                    {/* Banner Image Area */}
                                    <div className="relative h-64 md:h-72 w-full overflow-hidden">
                                        <Image
                                            src={imageUrl}
                                            alt={promo.title}
                                            fill
                                            className="object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
                                            unoptimized={!imageUrl.includes('unsplash')}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-0"></div>
                                        <div className="absolute bottom-4 left-4 right-4 text-white flex items-center gap-2 text-sm font-semibold z-10">
                                            <Calendar size={18} />
                                            Từ {startDate} - đến {endDate}
                                        </div>
                                    </div>

                                    {/* Content Area */}
                                    <div className="p-8 flex flex-col flex-grow">
                                        <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-vinfast-blue transition-colors line-clamp-2">
                                            {promo.title}
                                        </h3>
                                        <p className="text-gray-600 mb-8 flex-grow line-clamp-3 leading-relaxed">
                                            {promo.description}
                                        </p>

                                        {/* CTA Button */}
                                        <div className="w-full bg-vinfast-blue text-white py-4 rounded-xl font-bold text-center group-hover:bg-blue-800 transition-colors flex items-center justify-center gap-2 shadow-md group-hover:shadow-xl">
                                            Nhận Ưu Đãi Ngay <ArrowRight size={20} />
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
