import { supabase } from "@/lib/supabase";
import BlogFilterGrid, { BlogPost } from "@/components/client/blog-filter-grid";
import { Tag } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Tin Tức & Sự Kiện | VinFast Xanh Mekong Cần Thơ',
    description: 'Cập nhật tin mới nhất về thị trường xe điện, hướng dẫn sử dụng xe và các hoạt động cộng đồng của VinFast Mekong.',
    openGraph: {
        title: 'Tin Tức & Sự Kiện | VinFast Xanh Mekong Cần Thơ',
        description: 'Cập nhật tin mới nhất về thị trường xe điện, hướng dẫn sử dụng xe và các hoạt động cộng đồng của VinFast Mekong.',
        url: '/blog',
        images: [{ url: '/logo-vinfast.jpg' }],
    }
};

export const revalidate = 60; // 60s cache update

interface RawPost {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    content: string | null;
    category: string;
    created_at: string;
    thumbnail_url: string | null;
}

export default async function BlogPage() {
    // Lấy bài viết từ Supabase (bảng blogs JOIN media lấy ảnh)
    // Cột giả định: id, title, slug, excerpt, content, category, created_at, thumbnail_id
    const { data: postsData, error } = await supabase
        .from('blogs')
        .select(`
            id, title, slug, excerpt, content, category, created_at,
            thumbnail_url
        `)
        .order('created_at', { ascending: false });

    // Fallback: Nếu chưa tạo bảng trong SQL, chúng ta render mảng rỗng hoặc log lỗi.
    if (error) {
        console.warn("Table 'blogs' might not exist yet or error fetching:", error.message);
    }

    const posts = (postsData as unknown as RawPost[] || []).map((post) => {
        let finalExcerpt = post.excerpt;

        if (!finalExcerpt) {
            const rawContent = post.content || '';
            const plainText = rawContent.replace(/<[^>]+>/g, '');
            finalExcerpt = plainText.length > 150 ? plainText.substring(0, 150) + '...' : plainText;
        }

        return {
            ...post,
            excerpt: finalExcerpt
        };
    }) as BlogPost[];

    return (
        <div className="bg-vinfast-gray min-h-screen pb-20">
            {/* Page Header */}
            <div className="bg-white border-b border-gray-200 py-16 md:py-20 mb-12">
                <div className="container mx-auto px-4 md:px-8 text-center max-w-3xl">
                    <div className="inline-flex items-center justify-center gap-2 bg-blue-50 text-vinfast-blue px-4 py-2 rounded-full mb-6 font-semibold tracking-wide uppercase border border-blue-100">
                        <Tag size={16} /> Tin Tức & Sự Kiện
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 tracking-tight">
                        Blog VinFast Xanh Mekong
                    </h1>
                    <p className="text-gray-600 text-lg leading-relaxed">
                        Cập nhật những thông tin mới nhất về ôtô điện VinFast, các sự kiện lái thử tại Showroom và kinh nghiệm sử dụng xe hiệu quả.
                    </p>
                </div>
            </div>

            {/* Filtered Grid System */}
            <div className="container mx-auto px-4 md:px-8">
                <BlogFilterGrid initialPosts={posts} />
            </div>
        </div>
    );
}
