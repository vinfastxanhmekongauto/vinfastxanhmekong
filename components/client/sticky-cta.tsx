'use client';

import { Phone, MessageCircle, Car } from 'lucide-react';
import Link from 'next/link';

export default function StickyContact() {
    return (
        <div className="fixed bottom-0 left-0 w-full z-40 bg-vinfast-white border-t border-vinfast-gray shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] md:hidden">
            <div className="flex h-16">
                <a
                    href="tel:0907697036"
                    className="flex flex-1 flex-col items-center justify-center gap-1 border-r border-vinfast-gray text-vinfast-blue hover:bg-gray-50 transition-colors"
                >
                    <Phone size={20} />
                    <span className="text-[10px] font-medium leading-none">Gọi điện</span>
                </a>
                <a
                    href="https://zalo.me/0907697036"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-1 flex-col items-center justify-center gap-1 border-r border-vinfast-gray text-blue-500 hover:bg-gray-50 transition-colors"
                >
                    <MessageCircle size={20} />
                    <span className="text-[10px] font-medium leading-none">Zalo</span>
                </a>
                <Link
                    href="/contact?type=test-drive"
                    className="flex flex-1 flex-col items-center justify-center gap-1 bg-vinfast-blue text-vinfast-white hover:bg-blue-900 transition-colors"
                >
                    <Car size={20} />
                    <span className="text-[10px] font-medium leading-none">Đăng ký lái thử</span>
                </Link>
            </div>
        </div>
    );
}
