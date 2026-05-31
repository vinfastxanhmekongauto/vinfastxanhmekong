import { Metadata } from 'next';
import ContactClient from '@/components/client/contact-client';

export const metadata: Metadata = {
    title: 'Liên Hệ Showroom VinFast Mekong | Hỗ Trợ & Tư Vấn Cần Thơ',
    description: 'Liên hệ ngay với VinFast Xanh Mekong để được tư vấn giá xe, lái thử và hỗ trợ kỹ thuật tận tình tại Cần Thơ.',
    openGraph: {
        title: 'Liên Hệ Showroom VinFast Mekong | Hỗ Trợ & Tư Vấn Cần Thơ',
        description: 'Liên hệ ngay với VinFast Xanh Mekong để được tư vấn giá xe, lái thử và hỗ trợ kỹ thuật tận tình tại Cần Thơ.',
        url: '/contact',
        images: [{ url: '/logo-vinfast.jpg' }],
    }
};

export default function ContactPage() {
    return <ContactClient />;
}
