'use client';

import React, { useState } from 'react';
import { Share2, Check } from 'lucide-react';

interface ShareButtonProps {
    variant?: 'circular' | 'full';
    className?: string;
}

export default function ShareButton({ variant = 'circular', className = '' }: ShareButtonProps) {
    const [isCopied, setIsCopied] = useState(false);

    const handleShare = async () => {
        try {
            const url = window.location.href;
            await navigator.clipboard.writeText(url);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    if (variant === 'full') {
        return (
            <button
                type="button"
                onClick={handleShare}
                className={`flex-1 py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 border transition-all duration-200 active:scale-95 ${
                    isCopied
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300'
                } ${className}`}
            >
                {isCopied ? (
                    <>
                        <Check size={20} />
                        <span>Đã sao chép!</span>
                    </>
                ) : (
                    <>
                        <Share2 size={20} />
                        <span>Chia sẻ</span>
                    </>
                )}
            </button>
        );
    }

    return (
        <button
            type="button"
            onClick={handleShare}
            className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 active:scale-90 ${
                isCopied
                    ? 'bg-green-100 text-green-600 shadow-sm border border-green-200'
                    : 'bg-blue-100 text-blue-600 hover:bg-blue-200 shadow-sm border border-blue-200'
            } ${className}`}
            title={isCopied ? 'Đã sao chép liên kết!' : 'Sao chép liên kết chia sẻ'}
        >
            {isCopied ? <Check size={18} /> : <Share2 size={18} />}
        </button>
    );
}
