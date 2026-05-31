'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, FileText } from 'lucide-react';
import { useQuoteModal } from './QuoteModalProvider';

export interface ProductDisplay {
    id: string;
    name: string;
    slug: string;
    price_from: number | null;
    category?: string;
    specs: {
        range?: string;
        speed?: string;
        battery?: string;
    } | null;
    thumbnail_url?: string | null;
    tagline?: string | null;
    homepage_specs?: {
        range?: string;
        charge_time?: string;
        segment?: string;
    } | null;
    sale_status?: 'available' | 'booking' | 'coming_soon' | null;
    variants?: Array<{ name: string; price: number; note?: string }> | null;
    brochure_url?: string | null;
    extra_features_carousel?: {
        title?: string;
        discription?: string;
        description?: string;
        items?: {
            url: string;
            text: string;
        }[];
    } | null;
}

interface ProductCardProps {
    product: ProductDisplay;
}

export default function ProductCard({ product }: ProductCardProps) {
    const { openQuoteModal } = useQuoteModal();
    let imageUrl = product.thumbnail_url || `/images/products/${product.slug}.webp`;
    if (imageUrl.startsWith('/') && !imageUrl.startsWith('/images/products/')) {
        imageUrl = `/images/products/${imageUrl.split('/').pop()}`;
    }

    const range = product.specs?.range || "Đang cập nhật";
    const speed = product.specs?.speed || "Đang cập nhật";
    const battery = product.specs?.battery || "";

    return (
        <div className="bg-white h-full rounded-2xl overflow-hidden shadow-md hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col border border-gray-100 group">
            {/* Clickable Image Link */}
            <Link href={`/products/${product.slug}`} className="block relative h-56 md:h-64 w-full bg-vinfast-gray flex items-center justify-center p-6 cursor-pointer select-none">

                <div className="relative w-full h-full">
                    <Image
                        src={imageUrl}
                        alt={product.name}
                        fill
                        className="object-contain group-hover:scale-105 transition-transform duration-500"
                        unoptimized
                    />
                </div>
            </Link>

            {/* Content Details */}
            <div className="p-6 flex flex-col flex-grow">
                <Link href={`/products/${product.slug}`} className="block cursor-pointer flex-grow mb-4">

                    <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-1 group-hover:text-vinfast-blue transition-colors">
                        {product.name}
                    </h3>
                    <p className="text-vinfast-blue font-bold text-sm uppercase mb-1">
                        QUÃNG ĐƯỜNG: {product.homepage_specs?.range || 'ĐANG CẬP NHẬT'}
                    </p>
                    <p className="text-gray-500 text-sm mb-4">
                        Thời gian sạc: {product.homepage_specs?.charge_time || 'Đang cập nhật'}
                    </p>
                </Link>

                {product.variants && product.variants.length > 0 ? (
                    <div className="flex flex-col gap-2 mb-6 w-full border-t border-gray-100 pt-4">
                        {product.variants.map((variant, idx) => (
                            <div key={idx} className="flex flex-row justify-between items-center text-sm gap-2">
                                <span className="text-gray-600 font-medium truncate flex-1">
                                    {variant.name} {variant.note ? <span className="text-gray-400 text-xs">({variant.note})</span> : ''}
                                </span>
                                <span className="font-bold text-vinfast-blue whitespace-nowrap">
                                    {new Intl.NumberFormat('vi-VN').format(variant.price)} VNĐ
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col gap-2 mb-6 w-full border-t border-gray-100 pt-4">
                        <div className="flex flex-row justify-between items-center text-sm gap-2">
                            <span className="text-gray-600 font-medium truncate flex-1">
                                Giá bán
                            </span>
                            <span className="font-bold text-vinfast-blue whitespace-nowrap">
                                Liên hệ
                            </span>
                        </div>
                    </div>
                )}

                {/* CTA Button Group */}
                <div className="grid grid-cols-2 gap-3 mt-auto pt-4 border-t border-gray-100">
                    <Link
                        href={`/products/${product.slug}`}
                        className="border-2 border-vinfast-blue text-vinfast-blue font-bold px-3 py-2.5 rounded-xl text-xs md:text-sm text-center hover:bg-vinfast-blue/5 transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-sm"
                    >
                        Chi tiết
                    </Link>
                    <button
                        onClick={() => openQuoteModal(product.name)}
                        className="bg-vinfast-blue text-white font-bold px-3 py-2.5 rounded-xl text-xs md:text-sm text-center hover:bg-blue-800 transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-md cursor-pointer"
                    >
                        <FileText size={14} />
                        <span>Báo giá</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
