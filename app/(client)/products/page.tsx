import { Metadata } from 'next';
import { supabase } from "@/lib/supabase";
import ProductFilterGrid from "@/components/client/product-filter-grid";
import { ProductDisplay } from "@/components/client/product-card";
import ProductSection from "@/components/client/product-section";
import Image from "next/image";

export const metadata: Metadata = {
    title: 'Danh Sách Xe Ôtô Điện VinFast Chính Hãng | VinFast Mekong',
    description: 'Bảng giá và thông số các dòng ôtô điện VinFast VF 3, VF 5, VF 6, VF 7, VF 8, VF 9 chính hãng mới nhất tại showroom Cần Thơ.',
    alternates: {
        canonical: '/products',
    },
    openGraph: {
        title: 'Danh Sách Xe Ôtô Điện VinFast Chính Hãng | VinFast Mekong',
        description: 'Bảng giá và thông số các dòng ôtô điện VinFast VF 3, VF 5, VF 6, VF 7, VF 8, VF 9 chính hãng mới nhất tại showroom Cần Thơ.',
        url: '/products',
        images: [{ url: '/logo-vinfast.jpg' }],
    }
};

// Khắc phục Cache cho Next.js 14 server components
export const revalidate = 60;

export default async function ProductsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    // Resolve search params
    const resolvedSearchParams = await searchParams;
    const searchQuery = typeof resolvedSearchParams.search === 'string' ? resolvedSearchParams.search : '';

    // Fetch bestsellers
    const { data: bestsellerProductsData } = await supabase
        .from("products")
        .select("*")
        .eq("is_bestseller", true)
        .limit(10);

    const bestsellerProducts = ((bestsellerProductsData as any[]) || []).map(p => {
        const prices = p.variants && Array.isArray(p.variants) ? p.variants.map((v: any) => v.price).filter((pr: any) => typeof pr === 'number') : [];
        const price_from = prices.length > 0 ? Math.min(...prices) : null;
        return {
            ...p,
            price_from,
            specs: null,
        };
    });

    // Fetch initial searched products based on URL
    let initialProductsQuery = supabase
        .from('products')
        .select("*")
        .order('name', { ascending: true });

    if (searchQuery) {
        initialProductsQuery = initialProductsQuery.ilike('name', `%${searchQuery}%`);
    }

    const { data: initialProductsData } = await initialProductsQuery;
    const initialProductsRaw = (initialProductsData as any[]) || [];
    const initialProducts = initialProductsRaw
        .map(p => {
            const prices = p.variants && Array.isArray(p.variants) ? p.variants.map((v: any) => v.price).filter((pr: any) => typeof pr === 'number') : [];
            const price_from = prices.length > 0 ? Math.min(...prices) : null;
            return {
                ...p,
                price_from,
                specs: null,
            };
        })
        .sort((a, b) => (a.price_from ?? Infinity) - (b.price_from ?? Infinity));

    return (
        <div className="bg-vinfast-gray min-h-screen pb-20">
            {/* Hero Section */}
            <div className="relative h-[400px] md:h-[720px] w-full mb-12 flex items-center justify-center">
                {/* Background Image Options: /images/hero-bg.jpg or a placeholder if needed. */}
                <Image
                    src="/images/slides/slide-banner-1.webp" // Using an existing attractive slide image from previous work usually works best.
                    alt="VinFast Electric Bikes Hero"
                    fill
                    className="object-cover"
                    priority
                />
                <div className="absolute inset-0 bg-black/50"></div> {/* Dark overlay for text readability */}

                <div className="relative z-10 container mx-auto px-4 md:px-8 text-center md:text-left pt-16">
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 drop-shadow-md max-w-4xl">
                        Trải Nghiệm Kỷ Nguyên Di Chuyển Thông Minh Cùng VinFast
                    </h1>
                    <p className="text-gray-200 text-lg md:text-xl max-w-2xl leading-relaxed drop-shadow-sm">
                        Thiết kế tinh tế, vận hành mạnh mẽ và thông minh vượt trội. Trực tiếp cầm lái và cảm nhận sự khác biệt của công nghệ tương lai ngay hôm nay.
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 md:px-8">
                {/* Bestseller Section (4 items) */}
                {bestsellerProducts && bestsellerProducts.length > 0 && (
                    <div className="mb-16">
                        <ProductSection
                            title="Dòng Xe Bán Chạy"
                            description="Những mẫu xe được khách hàng Cần Thơ yêu thích và lựa chọn nhiều nhất."
                            products={bestsellerProducts as unknown as ProductDisplay[]}
                            viewAllLink="#all-products"
                        />
                    </div>
                )}

                {/* Main Filter Grid Section (Client-side fetches everything else with Skeleton) */}
                <div id="all-products" className="pt-4 scroll-mt-24">
                    <ProductFilterGrid initialProducts={initialProducts} />
                </div>
            </div>
        </div>
    );
}
