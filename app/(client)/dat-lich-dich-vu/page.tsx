import { Metadata } from 'next';
import ServiceBookingClient from '@/components/client/service-booking-client';
import { supabase } from '@/lib/supabase';

export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
    let ogImage = '/default-og.jpg';
    try {
        const { data: settings } = await supabase
            .from('service_settings')
            .select('og_image_url')
            .eq('service_type', 'booking')
            .maybeSingle();

        if (settings?.og_image_url) {
            ogImage = settings.og_image_url;
        }
    } catch (error) {
        console.error('Error fetching booking metadata settings:', error);
    }

    return {
        title: 'Đặt lịch dịch vụ | VinFast Xanh Mekong',
        description: 'Đặt lịch bảo dưỡng, sửa chữa xe VinFast nhanh chóng và tiện lợi tại xưởng dịch vụ VinFast Xanh Mekong.',
        alternates: {
            canonical: '/dat-lich-dich-vu',
        },
        openGraph: {
            title: 'Đặt lịch dịch vụ | VinFast Xanh Mekong',
            description: 'Đặt lịch bảo dưỡng, sửa chữa xe VinFast nhanh chóng và tiện lợi tại xưởng dịch vụ VinFast Xanh Mekong.',
            url: '/dat-lich-dich-vu',
            images: [
                {
                    url: ogImage,
                    width: 1200,
                    height: 630,
                }
            ],
        }
    };
}

export default async function ServiceBookingPage() {
    const { data: settings } = await supabase
        .from('service_settings')
        .select('banner_url')
        .eq('service_type', 'booking')
        .maybeSingle();

    return <ServiceBookingClient bannerUrl={settings?.banner_url} />;
}
