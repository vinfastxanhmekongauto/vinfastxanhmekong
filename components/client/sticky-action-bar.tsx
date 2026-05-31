'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, MessageCircle } from 'lucide-react';

interface StickyActionBarProps {
    phone?: string;
    zaloUrl?: string;
    product?: any;
}

export default function StickyActionBar({ 
    phone = "0907697036", 
    zaloUrl = "https://zalo.me/0907697036",
    product 
}: StickyActionBarProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const toggleVisibility = () => {
            // Hiển thị thanh bar khi scroll xuống hơn 300px
            if (window.scrollY > 300) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener('scroll', toggleVisibility);
        return () => window.removeEventListener('scroll', toggleVisibility);
    }, []);

    const handleScrollToForm = () => {
        const formElement = document.getElementById('tu-van');
        if (formElement) {
            formElement.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] p-3 md:hidden"
                >
                    <div className="flex items-center justify-between gap-3 max-w-lg mx-auto">
                        {/* 2 Nút Icon: Gọi và Zalo */}
                        <div className="flex items-center gap-3 shrink-0">
                            <a
                                href={`tel:${phone}`}
                                className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white shadow-md hover:bg-green-600 transition-colors"
                            >
                                <Phone size={22} className="animate-pulse" />
                            </a>
                            <a
                                href={zaloUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-md hover:bg-blue-600 transition-colors"
                            >
                                <MessageCircle size={24} />
                            </a>
                        </div>

                        {/* Nút Đăng ký tư vấn chiếm khoảng 60% */}
                        <button
                            onClick={handleScrollToForm}
                            className="flex-1 bg-vinfast-blue text-white h-12 rounded-full font-bold text-sm shadow-md hover:bg-blue-800 transition-colors uppercase tracking-wide"
                        >
                            Đăng Ký Tư Vấn
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
