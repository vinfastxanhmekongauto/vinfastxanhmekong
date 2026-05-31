'use client';

import { ReactNode } from 'react';

interface ScrollButtonProps {
    targetId: string;
    className?: string;
    children: ReactNode;
}

export default function ScrollButton({ targetId, className, children }: ScrollButtonProps) {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        const element = document.getElementById(targetId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <button onClick={handleClick} className={className}>
            {children}
        </button>
    );
}
