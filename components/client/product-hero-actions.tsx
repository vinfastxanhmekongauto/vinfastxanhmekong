'use client';

import { useState } from 'react';
import { Car, FileText, Phone } from 'lucide-react';
import dynamic from 'next/dynamic';

const ModalWrapper = dynamic(() => import('./quick-action-modals').then(mod => mod.ModalWrapper), { ssr: false });
const LeadFormModal = dynamic(() => import('./quick-action-modals').then(mod => mod.LeadFormModal), { ssr: false });

interface ProductHeroActionsProps {
    productName: string;
    layout?: 'center' | 'magazine';
}

export default function ProductHeroActions({ productName, layout = 'center' }: ProductHeroActionsProps) {
    const [activeModal, setActiveModal] = useState<'testDrive' | 'quote' | null>(null);

    return (
        <div className={`w-full flex flex-col ${layout === 'magazine' ? 'items-start' : 'items-center'} gap-6`}>
            {/* CTA Buttons */}
            <div className={`flex flex-col sm:flex-row gap-4 w-full ${layout === 'magazine' ? 'sm:w-auto' : 'sm:justify-center'}`}>
                <button
                    onClick={() => setActiveModal('testDrive')}
                    className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#1464F4] text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-blue-500/20 active:scale-95"
                >
                    <Car size={18} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
                    <span>Đăng Ký Lái Thử</span>
                </button>

                <button
                    onClick={() => setActiveModal('quote')}
                    className="group inline-flex items-center justify-center gap-3 px-8 py-4 border-2 border-white/30 text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-white hover:text-black transition-all backdrop-blur-sm active:scale-95"
                >
                    <FileText size={18} strokeWidth={3} className="group-hover:rotate-12 transition-transform" />
                    <span>Nhận Báo Giá</span>
                </button>
            </div>

            {/* Hotline - If magazine layout, we might position it separately in the parent, 
                but for now we'll keep it here with conditional alignment */}
            {layout === 'center' && (
                <a
                    href="tel:0907697036"
                    className="inline-flex items-center gap-2 text-xs font-bold text-white/40 hover:text-white transition-colors tracking-[0.2em] uppercase"
                >
                    <Phone size={14} fill="currentColor" />
                    Hotline: 0907 697 036
                </a>
            )}

            {activeModal && (
                <ModalWrapper isOpen={activeModal !== null} onClose={() => setActiveModal(null)}>
                    {activeModal === 'testDrive' && (
                        <LeadFormModal
                            title={`Đăng Ký Lái Thử ${productName}`}
                            onClose={() => setActiveModal(null)}
                            selectedCar={productName}
                        />
                    )}
                    {activeModal === 'quote' && (
                        <LeadFormModal
                            title={`Nhận Báo Giá ${productName}`}
                            onClose={() => setActiveModal(null)}
                            selectedCar={productName}
                        />
                    )}
                </ModalWrapper>
            )}
        </div>
    );
}

