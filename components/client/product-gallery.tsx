'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ProductGalleryProps {
    images: string[];
    productName: string;
}

export default function ProductGallery({ images, productName }: ProductGalleryProps) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [emblaMainRef, emblaMainApi] = useEmblaCarousel({ loop: true });
    const [emblaThumbsRef, emblaThumbsApi] = useEmblaCarousel({
        containScroll: 'keepSnaps',
        dragFree: true,
    });

    const onThumbClick = useCallback(
        (index: number) => {
            if (!emblaMainApi || !emblaThumbsApi) return;
            emblaMainApi.scrollTo(index);
        },
        [emblaMainApi, emblaThumbsApi]
    );

    const onSelect = useCallback(() => {
        if (!emblaMainApi || !emblaThumbsApi) return;
        setSelectedIndex(emblaMainApi.selectedScrollSnap());
        emblaThumbsApi.scrollTo(emblaMainApi.selectedScrollSnap());
    }, [emblaMainApi, emblaThumbsApi, setSelectedIndex]);

    useEffect(() => {
        if (!emblaMainApi) return;
        onSelect();
        emblaMainApi.on('select', onSelect);
        emblaMainApi.on('reInit', onSelect);
    }, [emblaMainApi, onSelect]);

    const scrollPrev = useCallback(() => emblaMainApi && emblaMainApi.scrollPrev(), [emblaMainApi]);
    const scrollNext = useCallback(() => emblaMainApi && emblaMainApi.scrollNext(), [emblaMainApi]);

    if (!images || images.length === 0) return null;

    return (
        <div className="flex flex-col gap-4">
            {/* Main Carousel */}
            <div className="relative group overflow-hidden rounded-[2rem] bg-white border border-gray-100 shadow-sm">
                {/* Stacked Images for Crossfade */}
                <div className="absolute inset-0 w-full h-full pointer-events-none z-10">
                    {images.map((src, index) => (
                        <div
                            key={index}
                            className={`absolute inset-0 w-full h-full transition-opacity duration-500 ease-in-out ${index === selectedIndex ? 'opacity-100' : 'opacity-0'
                                }`}
                        >
                            <Image
                                src={src}
                                alt={`${productName} ${index + 1}`}
                                fill
                                className="object-contain"
                                unoptimized
                                priority={index === 0}
                            />
                        </div>
                    ))}
                </div>

                {/* Embla drag area (invisible/transparent dummy slides to receive swipe gestures) */}
                <div className="overflow-hidden relative z-20" ref={emblaMainRef}>
                    <div className="flex touch-pan-y">
                        {images.map((_, index) => (
                            <div className="flex-[0_0_100%] min-w-0 relative aspect-video" key={index}>
                                {/* Empty slide to maintain aspect ratio and allow dragging */}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Navigation */}
                {images.length > 1 && (
                    <>
                        <button
                            onClick={scrollPrev}
                            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center text-gray-800 hover:bg-white hover:text-[#00358E] transition-all opacity-0 group-hover:opacity-100 shadow-lg z-30"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <button
                            onClick={scrollNext}
                            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center text-gray-800 hover:bg-white hover:text-[#00358E] transition-all opacity-0 group-hover:opacity-100 shadow-lg z-30"
                        >
                            <ChevronRight size={24} />
                        </button>
                    </>
                )}

                {/* Counter */}
                <div className="absolute bottom-4 right-4 px-3 py-1 bg-black/40 backdrop-blur-md text-white text-[10px] font-bold rounded-full tracking-widest z-30">
                    {selectedIndex + 1} / {images.length}
                </div>
            </div>

            {/* Thumbnail Strip */}
            {images.length > 1 && (
                <div className="overflow-hidden" ref={emblaThumbsRef}>
                    <div className="flex gap-3">
                        {images.map((src, index) => (
                            <button
                                key={index}
                                onClick={() => onThumbClick(index)}
                                className={`relative flex-[0_0_80px] md:flex-[0_0_100px] aspect-square rounded-xl overflow-hidden border-2 transition-all ${index === selectedIndex
                                    ? 'border-[#00358E] scale-95 shadow-lg'
                                    : 'border-transparent opacity-50 hover:opacity-100'
                                    }`}
                            >
                                <Image
                                    src={src}
                                    alt={`Thumb ${index + 1}`}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
