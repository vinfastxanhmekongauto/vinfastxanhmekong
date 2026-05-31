'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface TechSpecsTableProps {
    markdown: string;
    productName: string;
    onQuoteClick?: () => void;
    brochureUrl?: string | null;
}

export default function TechSpecsTable({ markdown, productName, onQuoteClick, brochureUrl }: TechSpecsTableProps) {
    if (!markdown) return null;

    return (
        <section className="bg-[#333333] py-20 md:py-32 relative overflow-hidden">
            {/* Transition 1: White Hero/Interior to Dark Tech Specs */}
            <div className="absolute top-0 left-0 w-full h-12 bg-gradient-to-b from-black/30 to-transparent pointer-events-none z-10"></div>

            {/* VinFast Watermark - Behind Title and Table */}
            <div className="absolute left-0 top-10 pointer-events-none select-none opacity-10 z-0">
                <span className="text-8xl md:text-[15rem] font-black text-white uppercase tracking-tighter italic">
                    VinFast
                </span>
            </div>

            <div className="container mx-auto px-4 md:px-8 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 lg:gap-20 items-start">
                    {/* Left Header Section */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24">
                            <div className="w-16 h-1.5 bg-[#00358E] mb-8 rounded-full"></div>
                            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter leading-none uppercase italic mb-6">
                                Tổng quan <br /> sự khác biệt
                            </h2>
                            <p className="text-gray-400 text-xs font-black uppercase tracking-[0.4em]">{productName}</p>
                        </div>
                    </div>

                    {/* Markdown Content Block */}
                    <div className="lg:col-span-3">
                        <div className="overflow-x-auto custom-scrollbar pb-10">
                            <div className="tech-table">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {markdown}
                                </ReactMarkdown>
                            </div>
                        </div>

                        {/* Action Buttons - centered flex row */}
                        <div className="mt-8 flex flex-row justify-center gap-4 flex-wrap">
                            {/* Primary: NHẬN BÁO GIÁ */}
                            {onQuoteClick && (
                                <button
                                    onClick={onQuoteClick}
                                    className="px-10 py-4 bg-white text-[#00358E] font-black rounded-full hover:bg-[#00358E] hover:text-white hover:shadow-[0_0_30px_rgba(0,53,142,0.5)] transition-all duration-500 shadow-2xl shadow-black/50 uppercase tracking-widest text-xs flex items-center gap-3"
                                >
                                    <span>Nhận báo giá</span>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                                </button>
                            )}
                            {/* Secondary: XEM BROCHURE (outline) */}
                            {brochureUrl ? (
                                <a
                                    href={brochureUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-10 py-4 bg-transparent text-white font-black rounded-full border-2 border-white/30 hover:border-white hover:bg-white/10 transition-all duration-500 uppercase tracking-widest text-xs flex items-center gap-3"
                                >
                                    <span>Xem Brochure</span>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="5" y1="12" x2="19" y2="12"></line>
                                        <polyline points="12 5 19 12 12 19"></polyline>
                                    </svg>
                                </a>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { height: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 10px; }
            `}</style>
        </section>
    );
}
