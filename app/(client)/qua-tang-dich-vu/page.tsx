import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import { Gift } from 'lucide-react';

export const revalidate = 0; // Dynamic on-demand page data fetching

type GiftItem = {
    id: string;
    name: string;
    points_required: number;
    image_url: string;
    usage_instructions: string;
    care_instructions: string;
};

export async function generateMetadata(): Promise<Metadata> {
    let ogImage = '/default-og.jpg';
    try {
        const { data: settings } = await supabase
            .from('service_settings')
            .select('og_image_url')
            .eq('service_type', 'gifts')
            .maybeSingle();

        if (settings?.og_image_url) {
            ogImage = settings.og_image_url;
        }
    } catch (error) {
        console.error('Error fetching gifts metadata settings:', error);
    }

    return {
        title: 'Quà tặng | VinFast Xanh Mekong',
        description: 'Đổi điểm thưởng tích lũy khi sử dụng dịch vụ tại VinFast Xanh Mekong để nhận ngay các phần quà giá trị.',
        openGraph: {
            title: 'Quà tặng | VinFast Xanh Mekong',
            description: 'Đổi điểm thưởng tích lũy khi sử dụng dịch vụ tại VinFast Xanh Mekong để nhận ngay các phần quà giá trị.',
            url: '/qua-tang-dich-vu',
            images: [
                {
                    url: ogImage,
                    width: 1200,
                    height: 630,
                }
            ],
        }
    };
}

function parseBulletPoints(text: string) {
    if (!text) return <p className="text-gray-400 italic text-xs">Chưa có thông tin.</p>;
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return <p className="text-gray-400 italic text-xs">Chưa có thông tin.</p>;
    return (
        <ul className="list-disc ml-5 space-y-0.5 text-gray-650 text-xs mt-1 leading-relaxed">
            {lines.map((line, idx) => (
                <li key={idx}>{line}</li>
            ))}
        </ul>
    );
}

export default async function GiftsCatalogPage() {
    // Fetch configuration and gifts data from Supabase
    const { data: settings } = await supabase
        .from('service_settings')
        .select('banner_url, gifts_data')
        .eq('service_type', 'gifts')
        .maybeSingle();

    const bannerUrl = settings?.banner_url || '/default-banner.jpg';
    const rawGifts = (settings?.gifts_data as GiftItem[]) || [];

    // Sort gifts by points_required ascending
    const sortedGifts = [...rawGifts].sort((a, b) => a.points_required - b.points_required);

    // Group gifts by points_required
    const groupedGifts = sortedGifts.reduce((acc: { [key: number]: GiftItem[] }, gift) => {
        const pts = gift.points_required || 0;
        if (!acc[pts]) {
            acc[pts] = [];
        }
        acc[pts].push(gift);
        return acc;
    }, {});

    const sortedPointsKeys = Object.keys(groupedGifts)
        .map(Number)
        .sort((a, b) => a - b);

    return (
        <div className="bg-gray-50 min-h-screen pb-16">
            {/* Header Banner */}
            <div
                className="relative bg-gradient-to-br from-[#00358E] to-[#00205B] text-white py-16 md:py-24 mb-12 overflow-hidden bg-cover bg-center"
                style={{ backgroundImage: `url(${bannerUrl})` }}
            >
                {/* Dark overlay to improve text readability */}
                <div className="absolute inset-0 bg-black/50 z-0"></div>
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=2000')] opacity-15 bg-cover bg-center mix-blend-overlay z-0"></div>

                <div className="absolute right-0 bottom-0 pointer-events-none select-none opacity-5 translate-y-8 translate-x-8">
                    <span className="text-6xl md:text-9xl font-black italic uppercase tracking-tighter">
                        VinFast
                    </span>
                </div>

                <div className="container relative z-10 mx-auto px-4 md:px-8 text-center max-w-4xl space-y-4">
                    <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest text-blue-150 border border-white/10 mb-4">
                        <Gift size={12} />
                        Tích điểm đổi quà
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight drop-shadow-md">
                        QUÀ TẶNG VINFAST
                    </h1>
                    <p className="text-lg md:text-xl text-blue-105 leading-relaxed font-medium opacity-90 max-w-2xl mx-auto">
                        Đổi điểm thưởng tích lũy khi sử dụng dịch vụ tại VinFast Xanh Mekong để nhận ngay các phần quà giá trị.
                    </p>
                </div>
            </div>

            {/* Catalog Container */}
            <div className="max-w-5xl mx-auto px-4 md:px-8 -mt-10 relative z-20">
                {sortedPointsKeys.length === 0 ? (
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-16 text-center">
                        <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-gray-800 mb-1.5">Danh Mục Quà Tặng Đang Được Cập Nhật</h3>
                        <p className="text-gray-500 text-sm">Vui lòng quay lại sau để xem danh sách quà tặng đổi điểm.</p>
                    </div>
                ) : (
                    <div className="space-y-12">
                        {sortedPointsKeys.map((pts) => (
                            <div key={pts} className="space-y-6">
                                {/* Points Group Divider */}
                                <div className="flex items-center my-10">
                                    <div className="flex-grow border-t border-gray-300"></div>
                                    <span className="mx-4 px-6 py-2 bg-red-50 text-red-600 font-bold rounded-full border border-red-100 uppercase tracking-wide text-sm md:text-base">
                                        Quà tặng {pts} điểm
                                    </span>
                                    <div className="flex-grow border-t border-gray-300"></div>
                                </div>

                                {/* Gifts Grid */}
                                <div className="grid grid-cols-1 gap-6">
                                    {groupedGifts[pts].map((gift) => (
                                        <div key={gift.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row gap-6 hover:shadow-md transition-shadow">
                                            {/* Left side: Image */}
                                            <div className="relative w-full md:w-48 aspect-[4/3] md:aspect-square rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 shrink-0 self-center">
                                                <Image
                                                    src={gift.image_url}
                                                    alt={gift.name}
                                                    fill
                                                    className="object-contain p-4 w-full h-full"
                                                    unoptimized
                                                />
                                            </div>

                                            {/* Right side: details */}
                                            <div className="flex-1 space-y-4">
                                                <div>
                                                    <h3 className="text-lg font-bold text-gray-900 leading-tight">{gift.name}</h3>
                                                    <div className="text-red-600 font-semibold text-sm mt-1">{gift.points_required} điểm</div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-gray-100">
                                                    <div>
                                                        <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Hướng dẫn sử dụng:</h4>
                                                        {parseBulletPoints(gift.usage_instructions)}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Hướng dẫn bảo quản:</h4>
                                                        {parseBulletPoints(gift.care_instructions)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
