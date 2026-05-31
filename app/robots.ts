import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/admin/', '/api/'], // Không cho Google index trang quản trị và API
        },
        sitemap: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://vinfastxanhmekong.vn'}/sitemap.xml`,
    };
}
