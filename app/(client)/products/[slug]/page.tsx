import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import ProductDetailPageClient from './product-detail-client';
import { ProductDisplay } from '@/components/client/product-card';
import { SITE_URL } from '@/lib/constants';

export const revalidate = 60;

interface ProductDetailPageProps {
    params: Promise<{
        slug: string;
    }>
}

// --- SEO METADATA ---
export async function generateMetadata({ params }: ProductDetailPageProps): Promise<Metadata> {
    const supabase = await createClient();
    const { slug } = await params;
    const { data: product } = await supabase
        .from('products')
        .select(`*, hero_banner_url, subtitle, thumbnail_url`)
        .eq('slug', slug)
        .single();

    if (!product) return { title: 'Sản phẩm không tồn tại' };

    let imageUrl = product.thumbnail_url || product.hero_banner_url || `${SITE_URL}/images/products/${product.slug}.webp`;
    if (imageUrl.startsWith('/') && !imageUrl.startsWith('http')) {
        imageUrl = `${SITE_URL}${imageUrl}`;
    }

    return {
        title: `${product.name} | VinFast Xanh Mekong`,
        description: product.excerpt || `Trải nghiệm tương lai di chuyển thông minh cùng VinFast ${product.name}.`,
        alternates: {
            canonical: `/products/${product.slug}`,
        },
        openGraph: {
            title: `${product.name} | VinFast Xanh Mekong`,
            description: product.excerpt || `Khám phá xe điện VinFast ${product.name} tại Cần Thơ.`,
            url: `${SITE_URL}/products/${product.slug}`,
            siteName: 'VinFast Xanh Mekong',
            images: [{ url: imageUrl, width: 1200, height: 630, alt: product.name }],
            locale: 'vi_VN',
            type: 'website',
        },
    };
}

// --- MAIN PAGE COMPONENT ---
export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
    const supabase = await createClient();
    const resolvedParams = await params;
    const currentSlug = resolvedParams.slug;

    const { data: product, error } = await supabase
        .from('products')
        .select('*')
        .eq('slug', currentSlug)
        .single();

    if (error || !product) {
        notFound();
    }

    // ── SIMILAR PRODUCTS ──
    let similarQuery = supabase
        .from('products')
        .select(`id, name, slug, variants, homepage_specs, thumbnail_url`)
        .neq('id', product.id)
        .limit(4);
    if (product.category) {
        similarQuery = similarQuery.eq('category', product.category);
    }
    let { data: similarProductsData } = await similarQuery;
    if (!similarProductsData || similarProductsData.length < 4) {
        const existingIds = similarProductsData?.map(p => p.id) || [];
        const excludeIds = [product.id, ...existingIds];
        const { data: more } = await supabase
            .from('products')
            .select(`id, name, slug, variants, homepage_specs, thumbnail_url`)
            .not('id', 'in', `(${excludeIds.join(',')})`)
            .limit(4 - (similarProductsData?.length || 0));
        if (more) similarProductsData = [...(similarProductsData || []), ...more];
    }
    const similarProducts = ((similarProductsData as any[]) || []).map(p => {
        const prices = p.variants && Array.isArray(p.variants) ? p.variants.map((v: any) => v.price).filter((pr: any) => typeof pr === 'number') : [];
        const price_from = prices.length > 0 ? Math.min(...prices) : null;
        return { ...p, price_from };
    });

    // ── JSON-LD STRUCTURED DATA FOR SEO PRODUCT ──
    const productPrices = product.variants && Array.isArray(product.variants) ? product.variants.map((v: any) => v.price).filter((pr: any) => typeof pr === 'number') : [];
    const price = product.price || (productPrices.length > 0 ? Math.min(...productPrices) : 0);

    let productImageUrl = product.thumbnail_url || product.hero_banner_url || `${SITE_URL}/images/products/${product.slug}.webp`;
    if (productImageUrl.startsWith('/') && !productImageUrl.startsWith('http')) {
        productImageUrl = `${SITE_URL}${productImageUrl}`;
    }

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": product.name,
        "image": productImageUrl,
        "description": product.excerpt || `Trải nghiệm tương lai di chuyển thông minh cùng VinFast ${product.name}.`,
        "brand": {
            "@type": "Brand",
            "name": "VinFast"
        },
        "offers": {
            "@type": "Offer",
            "url": `${SITE_URL}/products/${product.slug}`,
            "priceCurrency": "VND",
            "price": price,
            "availability": "https://schema.org/InStock",
            "seller": {
                "@type": "AutoDealer",
                "name": "VinFast Xanh Mekong",
                "description": "Đại lý VinFast tại Cần Thơ bán ô tô điện và xe máy điện",
                "address": {
                    "@type": "PostalAddress",
                    "addressLocality": "Cần Thơ",
                    "addressCountry": "VN"
                }
            }
        }
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <ProductDetailPageClient product={product} similarProducts={similarProducts} />
        </>
    );
}
