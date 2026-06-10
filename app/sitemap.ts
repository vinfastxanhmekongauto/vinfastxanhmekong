import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://www.vinfastmekong.vn';
    
    // 1. Static core routes
    const coreRoutes = ['', '/o-to-dien', '/khuyen-mai', '/tin-tuc', '/dich-vu', '/lien-he'];
    const staticRoutes: MetadataRoute.Sitemap = coreRoutes.map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: route === '' ? 1.0 : 0.8,
    }));

    let productRoutes: MetadataRoute.Sitemap = [];
    let blogRoutes: MetadataRoute.Sitemap = [];
    let promoRoutes: MetadataRoute.Sitemap = [];

    // 2. Fetch products
    try {
        const { data: products } = await supabase
            .from('products')
            .select('slug, updated_at, created_at');

        if (products) {
            productRoutes = products.map((item) => ({
                url: `${baseUrl}/o-to-dien/${item.slug}`,
                lastModified: new Date(item.updated_at || item.created_at || new Date()),
                changeFrequency: 'weekly',
                priority: 0.8,
            }));
        }
    } catch (err) {
        console.error('Error fetching products for sitemap:', err);
    }

    // 3. Fetch blogs
    try {
        const { data: blogs } = await supabase
            .from('blogs')
            .select('slug, updated_at, created_at');

        if (blogs) {
            blogRoutes = blogs.map((item) => ({
                url: `${baseUrl}/tin-tuc/${item.slug}`,
                lastModified: new Date(item.updated_at || item.created_at || new Date()),
                changeFrequency: 'monthly',
                priority: 0.6,
            }));
        }
    } catch (err) {
        console.error('Error fetching blogs for sitemap:', err);
    }

    // 4. Fetch promotions
    try {
        const { data: promotions } = await supabase
            .from('promotions')
            .select('slug, updated_at, created_at')
            .eq('is_active', true);

        if (promotions) {
            promoRoutes = promotions.map((item) => ({
                url: `${baseUrl}/khuyen-mai/${item.slug}`,
                lastModified: new Date(item.updated_at || item.created_at || new Date()),
                changeFrequency: 'weekly',
                priority: 0.7,
            }));
        }
    } catch (err) {
        console.error('Error fetching promotions for sitemap:', err);
    }

    return [...staticRoutes, ...productRoutes, ...blogRoutes, ...promoRoutes];
}
