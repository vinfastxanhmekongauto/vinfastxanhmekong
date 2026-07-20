import Header from '@/components/client/header';
import Footer from '@/components/client/footer';
import StickyContact from '@/components/client/sticky-cta';
import ChatWidget from '@/components/ChatWidget';
import { SiteSettingsProvider } from '@/components/client/SiteSettingsProvider';
import { QuoteModalProvider } from '@/components/client/QuoteModalProvider';
import { supabase } from '@/lib/supabase';
import { SITE_URL } from '@/lib/constants';

export default async function ClientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Fetch products for the mega-menu
    const { data: productsData } = await supabase
        .from('products')
        .select('id, name, slug, category, variants, thumbnail_url');

    const productsRaw = (productsData as any[]) || [];
    const products = productsRaw
        .map(p => {
            const prices = p.variants && Array.isArray(p.variants) ? p.variants.map((v: any) => v.price).filter((pr: any) => typeof pr === 'number') : [];
            const price_from = prices.length > 0 ? Math.min(...prices) : null;
            return { ...p, price_from };
        })
        .sort((a, b) => (a.price_from ?? Infinity) - (b.price_from ?? Infinity));

    return (
        <SiteSettingsProvider>
            <QuoteModalProvider>
                {/* LocalBusiness Schema for SEO */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "LocalBusiness",
                            "name": "VinFast Xanh Mekong",
                            "description": "Đại lý VinFast tại Cần Thơ bán ô tô điện và xe máy điện",
                            "url": SITE_URL,
                            "telephone": "0946156156",
                            "address": {
                                "@type": "PostalAddress",
                                "streetAddress": "Số 10362, đường Võ Nguyên Giáp, P.Hưng Phú",
                                "addressLocality": "Cần Thơ",
                                "addressCountry": "VN"
                            },
                            "openingHoursSpecification": {
                                "@type": "OpeningHoursSpecification",
                                "dayOfWeek": [
                                    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
                                ],
                                "opens": "08:00",
                                "closes": "20:00"
                            }
                        })
                    }}
                />
                <div className="flex min-h-screen flex-col bg-vinfast-white">
                    <Header products={products} />
                    {/* 
                Main content wrapper with pb-16 to ensure bottom content 
                isn't hidden by the sticky CTA on mobile devices.
              */}
                    <main className="flex-1 md:pb-0">
                        {children}
                    </main>
                    <Footer />
                    <StickyContact />
                    <ChatWidget />
                </div>
            </QuoteModalProvider>
        </SiteSettingsProvider>
    );
}
