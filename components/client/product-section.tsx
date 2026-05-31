'use client';

import React, { useCallback } from 'react';
import Link from 'next/link';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import ProductCard, { ProductDisplay } from '@/components/client/product-card';

interface ProductSectionProps {
    title: string;
    description: string;
    products: ProductDisplay[];
    viewAllLink?: string;
    forceGrid?: boolean;
}

export default function ProductSection({ title, description, products, viewAllLink, forceGrid }: ProductSectionProps) {
    const [emblaRef, emblaApi] = useEmblaCarousel(
        {
            align: 'start',
            slidesToScroll: 1,
            containScroll: 'trimSnaps',
            dragFree: false, // dragFree false forces it to snap properly per slide
            loop: true,
            duration: 60, // slower transition between slides (~600ms roughly)
        },
        [Autoplay({ delay: 3000, stopOnInteraction: false })]
    );

    const scrollPrev = useCallback(() => {
        if (emblaApi) emblaApi.scrollPrev();
    }, [emblaApi]);

    const scrollNext = useCallback(() => {
        if (emblaApi) emblaApi.scrollNext();
    }, [emblaApi]);

    if (!products || products.length === 0) return null;

    const useCarousel = products.length > 3 && !forceGrid;

    return (
        <section className="py-16">
            <div className="container mx-auto px-4 md:px-8">
                {/* Header Area */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
                    <div className="max-w-3xl">
                        <h2 className="text-3xl md:text-4xl font-extrabold text-vinfast-blue mb-3">
                            {title}
                        </h2>
                        <p className="text-gray-600 text-lg">
                            {description}
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        {useCarousel && (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={scrollPrev}
                                    className="p-2.5 rounded-full bg-white border border-gray-200 text-gray-700 hover:text-vinfast-blue hover:border-vinfast-blue shadow-sm hover:shadow-md transition-all group"
                                    aria-label="Previous slide"
                                >
                                    <ChevronLeft size={20} className="group-active:-translate-x-1 transition-transform" />
                                </button>
                                <button
                                    onClick={scrollNext}
                                    className="p-2.5 rounded-full bg-white border border-gray-200 text-gray-700 hover:text-vinfast-blue hover:border-vinfast-blue shadow-sm hover:shadow-md transition-all group"
                                    aria-label="Next slide"
                                >
                                    <ChevronRight size={20} className="group-active:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        )}
                        {viewAllLink && (
                            <Link
                                href={viewAllLink}
                                className="flex items-center gap-2 text-vinfast-blue font-bold px-4 py-2 md:px-5 md:py-2.5 rounded-full bg-vinfast-blue/10 hover:bg-vinfast-blue hover:text-white transition-colors border border-vinfast-blue/20 whitespace-nowrap text-sm md:text-base"
                            >
                                Xem tất cả <ArrowRight size={18} />
                            </Link>
                        )}
                    </div>
                </div>

                {/* Content Area */}
                {useCarousel ? (
                    /* Carousel Layout */
                    <div className="relative">
                        <div className="overflow-hidden" ref={emblaRef}>
                            <div className="flex touch-pan-y -ml-4 sm:-ml-6 md:-ml-8" style={{ backfaceVisibility: 'hidden' }}>
                                {products.map((product) => (
                                    <div
                                        key={product.id}
                                        className="flex-[0_0_100%] sm:flex-[0_0_50%] lg:flex-[0_0_33.333333%] min-w-0 pl-4 sm:pl-6 md:pl-8 h-auto flex-shrink-0"
                                    >
                                        <ProductCard product={product} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Grid Layout */
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 justify-center">
                        {products.map((product) => (
                            <div key={product.id} className="h-full">
                                <ProductCard product={product} />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
