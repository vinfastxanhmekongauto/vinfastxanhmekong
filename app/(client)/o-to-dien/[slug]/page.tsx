import { Metadata } from 'next';
import { cache } from 'react';
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

// ── CACHED PRODUCT FETCH (deduplicated across generateMetadata + page render) ──
const getProduct = cache(async (slug: string) => {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .single();
    return { product: data, error };
});

// --- SEO METADATA ---
export async function generateMetadata({ params }: ProductDetailPageProps): Promise<Metadata> {
    const { slug } = await params;
    const { product } = await getProduct(slug);

    if (!product) return { title: 'Sản phẩm không tồn tại' };

    let imageUrl = product.thumbnail_url || product.hero_banner_url || `${SITE_URL}/images/products/${product.slug}.webp`;
    if (imageUrl.startsWith('/') && !imageUrl.startsWith('http')) {
        imageUrl = `${SITE_URL}${imageUrl}`;
    }

    return {
        title: `${product.name} | VinFast Xanh Mekong`,
        description: product.excerpt || `Trải nghiệm tương lai di chuyển thông minh cùng VinFast ${product.name}.`,
        alternates: {
            canonical: `/o-to-dien/${product.slug}`,
        },
        openGraph: {
            title: `${product.name} | VinFast Xanh Mekong`,
            description: product.excerpt || `Khám phá xe điện VinFast ${product.name} tại Cần Thơ.`,
            url: `${SITE_URL}/o-to-dien/${product.slug}`,
            siteName: 'VinFast Xanh Mekong',
            images: [{ url: imageUrl, width: 1200, height: 630, alt: product.name }],
            locale: 'vi_VN',
            type: 'website',
        },
    };
}

// --- MAIN PAGE COMPONENT ---
export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
    const resolvedParams = await params;
    const currentSlug = resolvedParams.slug;

    const { product, error } = await getProduct(currentSlug);

    if (error || !product) {
        notFound();
    }

    // ── SIMILAR PRODUCTS (fetched in parallel where possible) ──
    const supabase = await createClient();

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
            "url": `${SITE_URL}/o-to-dien/${product.slug}`,
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
    const faqJsonLd = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": `Giá lăn bánh xe ${product.name} tại Cần Thơ bao nhiêu?`,
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": `Giá lăn bánh ${product.name} tại Cần Thơ bao gồm giá niêm yết cộng thêm phí ra biển số, phí bảo trì đường bộ và bảo hiểm trách nhiệm dân sự. Đặc biệt, xe ô tô điện đang được miễn 100% lệ phí trước bạ.`
                }
            },
            {
                "@type": "Question",
                "name": `Mua xe ${product.name} trả góp cần giấy tờ gì?`,
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": `Đại lý VinFast Xanh Mekong hỗ trợ vay trả góp ${product.name} lên đến 80% giá trị xe với lãi suất ưu đãi. Thủ tục vô cùng đơn giản gồm: CCCD gắn chip, Giấy xác nhận tình trạng hôn nhân và Chứng minh thu nhập.`
                }
            },
            {
                "@type": "Question",
                "name": `${product.name} có chính sách thuê pin không?`,
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": `Có. Đối với dòng xe ${product.name}, VinFast cung cấp tùy chọn: mua xe kèm pin hoặc mua xe thuê pin. Pin sẽ được VinFast bảo hành và thay mới hoàn toàn miễn phí khi dung lượng sạc tối đa giảm xuống dưới 70%.`
                }
            },
            {
                "@type": "Question",
                "name": `Sạc pin xe ${product.name} ở đâu? Có sạc tại nhà được không?`,
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": `VinFast sở hữu hệ thống trạm sạc công cộng phủ sóng khắp 63 tỉnh thành phố. Ngoài ra, bạn hoàn toàn có thể chủ động sạc ${product.name} tại nhà bằng bộ sạc di động chính hãng đi kèm vô cùng tiện lợi và an toàn.`
                }
            }
        ]
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
            />
            <ProductDetailPageClient product={product} similarProducts={similarProducts} />
        </>
    );
}

