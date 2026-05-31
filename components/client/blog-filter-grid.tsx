'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, ArrowRight, Tag } from 'lucide-react';

export interface BlogPost {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content?: string;
    category: string;
    created_at: string;
    thumbnail_url: string | null;
}

interface BlogFilterGridProps {
    initialPosts: BlogPost[];
}

const CATEGORIES = ['Tất cả', 'Tin tức VinFast', 'Sự kiện Showroom', 'Hướng dẫn sử dụng xe'];

export default function BlogFilterGrid({ initialPosts }: BlogFilterGridProps) {
    const [activeCategory, setActiveCategory] = useState('Tất cả');

    // Filter Logic
    const filteredPosts = initialPosts.filter(post => {
        if (activeCategory === 'Tất cả') return true;
        return post.category === activeCategory;
    });

    const hasFeatured = filteredPosts.length > 0 && activeCategory === 'Tất cả';
    const featuredPost = hasFeatured ? filteredPosts[0] : null;
    const gridPosts = hasFeatured ? filteredPosts.slice(1) : filteredPosts;

    return (
        <div className="space-y-12">
            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center justify-center gap-3">
                {CATEGORIES.map((category) => (
                    <button
                        key={category}
                        onClick={() => setActiveCategory(category)}
                        className={`px-6 py-2.5 rounded-full font-semibold transition-all duration-300 shadow-sm border ${activeCategory === category
                                ? 'bg-vinfast-blue text-white border-vinfast-blue scale-105'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-vinfast-blue hover:text-vinfast-blue hover:shadow-md'
                            }`}
                    >
                        {category}
                    </button>
                ))}
            </div>

            {filteredPosts.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                        <Tag size={32} />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Chưa có bài viết nào</h3>
                    <p className="text-gray-500">Nội dung cho chuyên mục này đang được cập nhật.</p>
                </div>
            ) : (
                <>
                    {/* Featured Hero Post */}
                    {featuredPost && (
                        <div className="bg-white rounded-3xl overflow-hidden shadow-xl border border-gray-100 group animate-fade-in relative z-10 w-full mb-12">
                            <div className="grid grid-cols-1 lg:grid-cols-2">
                                <div className="relative h-72 lg:h-auto overflow-hidden">
                                    <Image
                                        src={featuredPost.thumbnail_url || '/images/placeholder.webp'}
                                        alt={featuredPost.title}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
                                        unoptimized={!featuredPost.thumbnail_url?.includes('unsplash')}
                                    />
                                    <div className="absolute top-4 left-4 bg-vinfast-blue text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-md uppercase tracking-wider">
                                        Bài Viết Mới Nhất
                                    </div>
                                </div>

                                <div className="p-8 md:p-12 xl:p-16 flex flex-col justify-center">
                                    <div className="flex items-center gap-4 text-sm text-vinfast-blue font-semibold mb-4">
                                        <span className="bg-blue-50 px-3 py-1 rounded-md">{featuredPost.category}</span>
                                        <span className="flex items-center gap-1 text-gray-500"><Calendar size={16} className="mb-0.5" /> {new Date(featuredPost.created_at).toLocaleDateString('vi-VN')}</span>
                                    </div>
                                    <h2 className="text-3xl lg:text-4xl font-black text-gray-900 mb-6 group-hover:text-vinfast-blue transition-colors leading-tight">
                                        <Link href={`/blog/${featuredPost.slug}`}>{featuredPost.title}</Link>
                                    </h2>
                                    <p className="text-gray-600 text-lg leading-relaxed mb-8 line-clamp-3">
                                        {featuredPost.excerpt}
                                    </p>
                                    <Link
                                        href={`/blog/${featuredPost.slug}`}
                                        className="inline-flex items-center gap-2 bg-vinfast-blue self-start text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-800 transition-colors shadow-lg hover:shadow-xl"
                                    >
                                        Đọc Tiếp <ArrowRight size={20} />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Standard Grid Layout */}
                    {gridPosts.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {gridPosts.map((post) => (
                                <div key={post.id} className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group flex flex-col border border-gray-100">
                                    <div className="relative h-56 overflow-hidden">
                                        <Image
                                            src={post.thumbnail_url || '/images/placeholder.webp'}
                                            alt={post.title}
                                            fill
                                            className="object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
                                            unoptimized={!post.thumbnail_url?.includes('unsplash')}
                                        />
                                        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur text-vinfast-blue border border-blue-100 px-3 py-1 rounded-md text-xs font-bold shadow-sm">
                                            {post.category}
                                        </div>
                                    </div>

                                    <div className="p-6 flex flex-col flex-grow">
                                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                                            <Calendar size={14} className="shrink-0" />
                                            {new Date(post.created_at).toLocaleDateString('vi-VN')}
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-vinfast-blue transition-colors line-clamp-2 leading-tight">
                                            <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                                        </h3>
                                        <p className="text-gray-600 mb-6 line-clamp-3 text-sm leading-relaxed flex-grow">
                                            {post.excerpt}
                                        </p>
                                        <div className="pt-4 border-t border-gray-100 mt-auto">
                                            <Link
                                                href={`/blog/${post.slug}`}
                                                className="inline-flex items-center gap-2 text-vinfast-blue font-bold hover:text-blue-800 transition-colors"
                                            >
                                                Đọc Tiếp <ArrowRight size={18} />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
