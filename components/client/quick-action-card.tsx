'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface QuickActionCardProps {
    title: string;
    icon: LucideIcon;
    desc: string;
    onClick?: () => void;
    disabled?: boolean;
    color?: string;
}

export default function QuickActionCard({ 
    title, 
    icon: Icon, 
    desc, 
    onClick, 
    disabled = false,
    color = "bg-blue-50 text-[#1464F4]"
}: QuickActionCardProps) {
    return (
        <button
            onClick={!disabled ? onClick : undefined}
            className={`group block w-full text-left focus:outline-none h-full ${disabled ? 'opacity-40 grayscale cursor-not-allowed' : 'cursor-pointer'}`}
            disabled={disabled}
        >
            <div className={`bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8 text-center flex flex-col items-center transition-all duration-300 h-full ${!disabled && 'hover:shadow-xl hover:border-vinfast-blue/30 hover:-translate-y-1'}`}>
                <div className={`w-16 h-16 ${color} rounded-2xl flex items-center justify-center mb-6 transition-transform ${!disabled && 'group-hover:scale-110'}`}>
                    <Icon size={32} />
                </div>
                <h4 className="text-xl font-bold text-[#152B4D] mb-3 uppercase tracking-tight leading-tight">{title}</h4>
                <p className="text-gray-500 text-sm leading-relaxed mb-6 flex-1">
                    {desc}
                </p>
                {!disabled && (
                    <span className="text-vinfast-blue font-bold text-sm flex items-center gap-2 group-hover:gap-3 transition-all">
                        Khám phá ngay <span className="text-lg">→</span>
                    </span>
                )}
            </div>
        </button>
    );
}
