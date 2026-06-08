import { Metadata } from 'next';
import ServicesClient from './services-client';

export const metadata: Metadata = {
    title: 'Dịch Vụ Hậu Mãi & Bảo Hành VinFast Mekong Cần Thơ',
    description: 'Chính sách bảo hành vượt trội 7-10 năm, dịch vụ cứu hộ 24/7 và sửa chữa lưu động Mobile Service chính hãng VinFast tại Xanh Mekong Cần Thơ.',
    alternates: {
        canonical: '/dich-vu',
    },
    openGraph: {
        title: 'Dịch Vụ Hậu Mãi & Bảo Hành VinFast Mekong Cần Thơ',
        description: 'Chính sách bảo hành vượt trội 7-10 năm, dịch vụ cứu hộ 24/7 và sửa chữa lưu động Mobile Service chính hãng VinFast tại Xanh Mekong Cần Thơ.',
        url: '/dich-vu',
        images: [{ url: '/banner-dich-vu.webp' }],
    }
};

export default function ServicesPage() {
    return <ServicesClient />;
}
