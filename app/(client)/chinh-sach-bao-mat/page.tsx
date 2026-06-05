import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ShieldCheck } from 'lucide-react';

export const revalidate = 0; // Always serve fresh content from CMS

export const metadata: Metadata = {
    title: 'Chính Sách Bảo Mật | VinFast Xanh Mekong',
    description: 'Chính sách bảo mật thông tin khách hàng tại VinFast Xanh Mekong Cần Thơ.',
    openGraph: {
        title: 'Chính Sách Bảo Mật | VinFast Xanh Mekong',
        description: 'Chính sách bảo mật thông tin khách hàng tại VinFast Xanh Mekong Cần Thơ.',
        url: '/chinh-sach-bao-mat',
        images: [{ url: 'https://vinfastxanhmekong.vercel.app/banner-tuyen-dung.webp' }],
    }
};

export default async function PrivacyPolicyPage() {
    // Fetch privacy policy markdown from Supabase site_settings table
    const { data: settings, error } = await supabase
        .from('site_settings')
        .select('privacy_policy_markdown')
        .eq('id', 1)
        .single();

    if (error) {
        console.error('Error fetching privacy policy for public page:', error);
    }

    const markdownContent = settings?.privacy_policy_markdown || '';

    return (
        <div className="bg-gray-50 min-h-screen pb-12">
            {/* Header Banner */}
            <div className="relative bg-gradient-to-br from-[#00358E] to-[#00205B] text-white py-16 md:py-24 text-center overflow-hidden">
                {/* Decorative background watermark */}
                <div className="absolute right-0 bottom-0 pointer-events-none select-none opacity-5 translate-y-8 translate-x-8">
                    <span className="text-6xl md:text-9xl font-black italic uppercase tracking-tighter">
                        VinFast
                    </span>
                </div>
                
                <div className="max-w-4xl mx-auto px-4 relative z-10 space-y-4">
                    <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest text-blue-100 border border-white/10">
                        <ShieldCheck size={12} />
                        Quyền lợi khách hàng
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black tracking-tight uppercase leading-tight drop-shadow-sm font-display">
                        Chính Sách Bảo Mật
                    </h1>
                    <p className="text-blue-100 max-w-xl mx-auto text-sm md:text-base font-medium opacity-90">
                        Cam kết bảo mật thông tin cá nhân và quyền riêng tư của khách hàng tại VinFast Xanh Mekong Cần Thơ.
                    </p>
                </div>
            </div>

            {/* Content Container */}
            <div className="max-w-4xl mx-auto px-4 md:px-8 -mt-8 relative z-20">
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-12">
                    {markdownContent ? (
                        <div className="prose prose-blue max-w-none text-gray-700 text-sm md:text-base leading-relaxed text-justify prose-p:text-gray-650 prose-headings:font-display prose-headings:text-gray-900 prose-headings:font-extrabold prose-strong:text-gray-900">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {markdownContent}
                            </ReactMarkdown>
                        </div>
                    ) : (
                        <div className="text-center py-20">
                            <ShieldCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 italic text-sm">Nội dung chính sách bảo mật đang được cập nhật.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
