import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Calendar, ArrowLeft, Tag } from 'lucide-react';
import { SITE_URL } from '@/lib/constants';

export const revalidate = 60; // Cache 60s

interface BlogDetailPageProps {
    params: Promise<{
        slug: string;
    }>
}

export async function generateMetadata({ params }: BlogDetailPageProps): Promise<Metadata> {
    const { slug } = await params;

    const { data: post } = await supabase
        .from('blogs')
        .select('title, excerpt, slug, thumbnail_url, content')
        .eq('slug', slug)
        .single();

    if (!post) {
        return {
            title: 'Bài viết không tồn tại | VinFast Xanh Mekong',
        };
    }

    let imageUrl = post.thumbnail_url || `${SITE_URL}/images/blogs/${slug}.webp`;
    if (imageUrl.startsWith('/') && !imageUrl.startsWith('http')) {
        imageUrl = `${SITE_URL}${imageUrl}`;
    }

    const cleanDesc = post.excerpt || (post.content ? post.content.substring(0, 160).replace(/<[^>]*>/g, '').replace(/\n/g, ' ') : 'Tin tức mới nhất từ VinFast Xanh Mekong.');

    return {
        title: `${post.title} | VinFast Xanh Mekong`,
        description: cleanDesc,
        alternates: {
            canonical: `/tin-tuc/${post.slug}`,
        },
        openGraph: {
            title: post.title,
            description: cleanDesc,
            url: `${SITE_URL}/tin-tuc/${post.slug}`,
            siteName: 'VinFast Xanh Mekong',
            images: [
                {
                    url: imageUrl,
                    width: 1200,
                    height: 630,
                    alt: post.title,
                },
            ],
            locale: 'vi_VN',
            type: 'article',
        },
    };
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

    let absoluteImageUrl = imageUrl;
    if (absoluteImageUrl.startsWith('/') && !absoluteImageUrl.startsWith('http')) {
        absoluteImageUrl = `${SITE_URL}${absoluteImageUrl}`;
    }

    const createdDate = new Date(post.created_at).toLocaleDateString('vi-VN');

    let finalExcerpt = post.excerpt;
    if (!finalExcerpt) {
        const rawContent = post.content || '';
        const plainText = rawContent.replace(/<[^>]+>/g, '');
        finalExcerpt = plainText.length > 250 ? plainText.substring(0, 250) + '...' : plainText;
    }

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": post.title,
        "image": [absoluteImageUrl],
        "datePublished": post.created_at,
        "dateModified": post.updated_at || post.created_at,
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

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <div className="bg-white min-h-screen pb-20">
                <div className="max-w-7xl mx-auto px-4 md:px-6 pt-8 md:pt-12">
                    {/* Back button */}
                    <Link href="/tin-tuc" className="inline-flex items-center text-sm font-semibold text-gray-500 hover:text-vinfast-blue transition-colors mb-8">
                        <ArrowLeft size={16} className="mr-2" /> Quay lại danh sách
                    </Link>

                    {/* Article Header */}
                    <div className="space-y-6">
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 leading-tight tracking-tight font-display">
                            {post.title}
                        </h1>

                        <div className="flex items-center gap-4 text-sm text-vinfast-blue font-semibold">
                            <span className="bg-blue-50 px-3 py-1.5 rounded-md border border-blue-100 flex items-center gap-1">
                                <Tag size={14} /> {post.category || 'Tin Tức'}
                            </span>
                            <span className="flex items-center gap-1 text-gray-500 font-normal">
                                <Calendar size={16} className="mb-0.5" /> {createdDate}
                            </span>
                        </div>
                    </div>

                    {/* Subtle line separator */}
                    <div className="my-8 border-b border-gray-200"></div>

                    {/* Excerpt if present */}
                    {finalExcerpt && (
                        <p className="text-xl text-gray-600 font-medium leading-relaxed border-l-4 border-vinfast-blue pl-6 mb-8">
                            {finalExcerpt}
                        </p>
                    )}

                    {/* Hero Thumbnail */}
                    <div className="relative w-full aspect-[16/9] rounded-3xl overflow-hidden  mb-8">
                        <Image
                            src={imageUrl}
                            alt={post.title}
                            fill
                            className="object-cover"
                            unoptimized
                            priority
                        />
                    </div>

                    {/* Main Content Area */}
                    <div className="mt-8 mb-16 flow-root">
                        {post.content ? (
                            <div className="prose prose-lg max-w-none prose-img:rounded-xl prose-img:w-full flow-root" dangerouslySetInnerHTML={{ __html: post.content }} />
                        ) : (
                            <p className="text-gray-500">Đang cập nhật nội dung chi tiết cho bài viết này.</p>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
