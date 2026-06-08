'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';

type MediaObj = { url: string } | null;

export type PromotionSlide = {
    id: string;
    title: string;
    slug: string;
    description?: string;
    banner_url?: string | null;
    mobile_url?: string | null;
};

interface HeroBannerProps {
    promotions: PromotionSlide[];
}

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=80&w=2000';

export default function HeroBanner({ promotions }: HeroBannerProps) {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const [emblaRef, emblaApi] = useEmblaCarousel(
        {
            loop: true,
            duration: 40,
            dragFree: false,
        },
        [Autoplay({ delay: 5000, stopOnInteraction: false, stopOnMouseEnter: true })]
    );

    const onSelect = useCallback(() => {
        if (!emblaApi) return;
        setSelectedIndex(emblaApi.selectedScrollSnap());
    }, [emblaApi]);

    useEffect(() => {
        if (!emblaApi) return;
        emblaApi.on('select', onSelect);
        onSelect();
        return () => { emblaApi.off('select', onSelect); };
    }, [emblaApi, onSelect]);

    const scrollTo = useCallback((index: number) => {
        if (emblaApi) emblaApi.scrollTo(index);
    }, [emblaApi]);

    // Fallback khi không có promotions
    if (promotions.length === 0) {
        return (
            <section className="relative w-full">
                <Image src={FALLBACK_IMG} alt="VinFast Hero" width={2000} height={857} className="w-full h-auto object-cover block" priority />
            </section>
        );
    }



    return (
        <section className="relative w-full">
            {/* ======= EMBLA CAROUSEL ======= */}
            <div className="overflow-hidden" ref={emblaRef}>
                <div className="flex" style={{ backfaceVisibility: 'hidden' }}>
                    {promotions.map((slide) => {
                        const desktopUrl = slide.banner_url || FALLBACK_IMG;
                        const mobileUrl = slide.mobile_url || desktopUrl;

                        return (
                            <div key={slide.id} className="flex-[0_0_100%] min-w-0 w-full h-auto relative">
                                <Link href={`/khuyen-mai/${slide.slug}`} className="cursor-pointer block w-full h-full">
                                    {/* Desktop Image */}
                                    <Image
                                        src={desktopUrl}
                                        alt={slide.title}
                                        width={1920}
                                        height={600}
                                        className="hidden md:block w-full h-auto object-cover"
                                        priority={true}
                                    />

                                    {/* Mobile Image */}
                                    <Image
                                        src={mobileUrl}
                                        alt={slide.title}
                                        width={750}
                                        height={1000}
                                        className="block md:hidden w-full h-auto object-cover"
                                        priority={true}
                                    />
                                </Link>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ======= DOT PAGINATION (đè lên ảnh, sát mép dưới) ======= */}
            {promotions.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 flex items-center gap-2">
                    {promotions.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => scrollTo(i)}
                            className={`rounded-full transition-all duration-300 ${i === selectedIndex
                                ? 'w-8 h-2.5 bg-white shadow-md'
                                : 'w-2.5 h-2.5 bg-white/40 hover:bg-white/70'
                                }`}
                            aria-label={`Slide ${i + 1}`}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}
