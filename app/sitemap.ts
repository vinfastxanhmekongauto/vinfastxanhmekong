import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { slugify } from '@/lib/utils';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseClient = createClient(supabaseUrl, supabaseKey);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://www.vinfastmekong.vn';
    
    // 1. Static core routes
    const coreRoutes = ['', '/o-to-dien', '/khuyen-mai', '/tin-tuc', '/dich-vu', '/lien-he'];
    const staticRoutes: MetadataRoute.Sitemap = [
        ...coreRoutes.map((route) => ({
            url: `${baseUrl}${route}`,
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: route === '' ? 1.0 : 0.8,
        })),
        {
            url: `${baseUrl}/tuyen-dung`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        }
    ];

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

    // 3. Fetch blogs (existing fetch)
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

    const existingRoutes = [...staticRoutes, ...productRoutes, ...blogRoutes, ...promoRoutes];

    // 5. Fetch New Dynamic Routes (Blogs & Jobs) non-destructively
    let newBlogRoutes: MetadataRoute.Sitemap = [];
    let newJobRoutes: MetadataRoute.Sitemap = [];

    try {
        // Fetch new blogs
        const { data: newBlogs, error: newBlogError } = await supabaseClient
            .from('blogs')
            .select('slug, updated_at')
            .eq('is_published', true);

        if (newBlogError) throw newBlogError;

        if (newBlogs) {
            newBlogRoutes = newBlogs.map((item) => ({
                url: `${baseUrl}/tin-tuc/${item.slug}`,
                lastModified: item.updated_at ? new Date(item.updated_at) : new Date(),
                changeFrequency: 'monthly',
                priority: 0.6,
            }));
        }

        // Fetch new jobs
        const { data: jobs, error: jobsError } = await supabaseClient
            .from('jobs')
            .select('id, positions, created_at');

        console.log('Sitemap Jobs Error:', jobsError);
        console.log('Sitemap Jobs Data Length:', jobs?.length);

        if (jobsError) throw jobsError;

        if (jobs) {
            jobs.forEach((job) => {
                let positions: any[] = [];
                if (job.positions) {
                    if (Array.isArray(job.positions)) {
                        positions = job.positions;
                    } else if (typeof job.positions === 'string') {
                        try {
                            positions = JSON.parse(job.positions);
                        } catch (e) {}
                    }
                }
                positions.forEach((pos) => {
                    if (pos.role && pos.isActive !== false) {
                        newJobRoutes.push({
                            url: `${baseUrl}/tuyen-dung/${slugify(pos.role)}`,
                            lastModified: new Date(job.created_at || new Date()),
                            changeFrequency: 'weekly',
                            priority: 0.7,
                        });
                    }
                });
            });
        }

        return [...existingRoutes, ...newBlogRoutes, ...newJobRoutes];
    } catch (error) {
        console.error('Error fetching new dynamic routes for sitemap:', error);
        // Gracefully fall back to the existing routes
        return existingRoutes;
    }
}
