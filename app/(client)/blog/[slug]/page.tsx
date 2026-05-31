import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Calendar, ArrowLeft, Tag } from 'lucide-react';

export const revalidate = 60; // Cache 60s

interface BlogDetailPageProps {
    params: Promise<{
        slug: string;
    }>
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
    const { slug } = await params;

    // Fetch Blog Post
    const { data: post, error } = await supabase
        .from('blogs')
        .select(`
            *,
            thumbnail_url
        `)
        .eq('slug', slug)
        .single();

    if (error || !post) {
        notFound();
    }

    // Process Image
    let imageUrl = post.thumbnail_url || `/images/blog/${post.slug}.webp`;
    if (imageUrl.startsWith('/') && !imageUrl.startsWith('/images/blogs/') && !imageUrl.startsWith('/images/promotions/')) {
        imageUrl = `/images/blogs/${imageUrl.split('/').pop()}`; // Fallback logic
    }

    const createdDate = new Date(post.created_at).toLocaleDateString('vi-VN');

    let finalExcerpt = post.excerpt;
    if (!finalExcerpt) {
        const rawContent = post.content || '';
        const plainText = rawContent.replace(/<[^>]+>/g, '');
        finalExcerpt = plainText.length > 250 ? plainText.substring(0, 250) + '...' : plainText;
    }

    return (
        <div className="bg-vinfast-gray min-h-screen pb-20">
            {/* Header Content Top */}
            <div className="bg-white border-b border-gray-200 py-12 md:py-16">
                <div className="container mx-auto px-4 md:px-8 max-w-4xl">
                    <Link href="/blog" className="inline-flex items-center text-sm font-semibold text-gray-500 hover:text-vinfast-blue transition-colors mb-8">
                        <ArrowLeft size={16} className="mr-2" /> Quay lại danh sách
                    </Link>

                    <div className="flex items-center gap-4 text-sm text-vinfast-blue font-semibold mb-6">
                        <span className="bg-blue-50 px-3 py-1.5 rounded-md border border-blue-100 flex items-center gap-1">
                            <Tag size={14} /> {post.category || 'Tin Tức'}
                        </span>
                        <span className="flex items-center gap-1 text-gray-500">
                            <Calendar size={16} className="mb-0.5" /> {createdDate}
                        </span>
                    </div>

                    <h1 className="text-3xl md:text-5xl lg:text-5xl font-black text-gray-900 leading-tight md:leading-snug mb-8 tracking-tight">
                        {post.title}
                    </h1>

                    <p className="text-xl text-gray-600 font-medium leading-relaxed border-l-4 border-vinfast-blue pl-6 mb-12">
                        {finalExcerpt}
                    </p>

                    {/* Hero Thumbnail */}
                    <div className="relative w-full aspect-[16/9] md:aspect-[21/9] rounded-3xl overflow-hidden shadow-lg border border-gray-100 bg-gray-100">
                        <Image
                            src={imageUrl}
                            alt={post.title}
                            fill
                            className="object-cover"
                            unoptimized
                            priority
                        />
                    </div>
                </div>
            </div>

            {/* Markdown Content Area */}
            <div className="container mx-auto px-4 md:px-8 mt-12 max-w-4xl">
                <div className="bg-white p-8 md:p-14 rounded-3xl shadow-sm border border-gray-100">
                    <div className="prose prose-lg md:prose-xl max-w-none text-gray-700 prose-p:leading-relaxed prose-headings:text-gray-900 prose-a:text-vinfast-blue prose-img:rounded-2xl">
                        {post.content ? (
                            <div dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br/>') }} />
                        ) : (
                            <p>Đang cập nhật nội dung chi tiết cho bài viết này.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
