import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { HeartHandshake } from 'lucide-react';

export const revalidate = 0; // Serve fresh content dynamically

export async function generateMetadata(): Promise<Metadata> {
    let ogImage = '/default-og.jpg';
    try {
        const { data: settings } = await supabase
            .from('service_settings')
            .select('og_image_url')
            .eq('service_type', 'care')
            .maybeSingle();

        if (settings?.og_image_url) {
            ogImage = settings.og_image_url;
        }
    } catch (error) {
        console.error('Error fetching care metadata settings:', error);
    }

    return {
        title: 'Chăm sóc khách hàng | VinFast Xanh Mekong',
        description: 'Chính sách bảo hành, bảo dưỡng và chương trình khách hàng thân thiết dành cho chủ xe VinFast.',
        openGraph: {
            title: 'Chăm sóc khách hàng | VinFast Xanh Mekong',
            description: 'Chính sách bảo hành, bảo dưỡng và chương trình khách hàng thân thiết dành cho chủ xe VinFast.',
            url: '/cham-soc-khach-hang',
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

export default async function CustomerCarePage() {
    // Fetch configuration for Customer Care from Supabase service_settings table
    const { data: settings } = await supabase
        .from('service_settings')
        .select('banner_url, content_markdown')
        .eq('service_type', 'care')
        .maybeSingle();

    const bannerUrl = settings?.banner_url || '/default-banner.jpg';
    const content = settings?.content_markdown || '';

    return (
        <div className="bg-gray-50 min-h-screen pb-12">
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
                        <HeartHandshake size={12} />
                        Quyền lợi đặc quyền
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight drop-shadow-md">
                        CHĂM SÓC KHÁCH HÀNG
                    </h1>
                    <p className="text-lg md:text-xl text-blue-105 leading-relaxed font-medium opacity-90 max-w-2xl mx-auto">
                        Chính sách hậu mãi, chương trình đặc quyền và dịch vụ hỗ trợ khách hàng của VinFast Xanh Mekong.
                    </p>
                </div>
            </div>

            {/* Content Container */}
            <div className="max-w-5xl mx-auto px-4 md:px-8 -mt-10 relative z-20">
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-12">
                    {content ? (
                        <div className="prose prose-blue max-w-none text-gray-700 text-sm md:text-base leading-relaxed text-justify prose-p:text-gray-650 prose-headings:font-display prose-headings:text-gray-900 prose-headings:font-extrabold prose-strong:text-gray-900">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {content}
                            </ReactMarkdown>
                        </div>
                    ) : (
                        <div className="text-center py-20">
                            <HeartHandshake className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 italic text-sm">Nội dung chăm sóc khách hàng đang được cập nhật.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
