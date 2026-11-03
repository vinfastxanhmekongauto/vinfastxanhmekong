'use client';

import React, { createContext, useContext, useState } from 'react';
import dynamic from 'next/dynamic';

const ModalWrapper = dynamic(() => import('./quick-action-modals').then(mod => mod.ModalWrapper), { ssr: false });
const LeadFormModal = dynamic(() => import('./quick-action-modals').then(mod => mod.LeadFormModal), { ssr: false });

export interface QuoteModalOptions {
    source?: string;
}

interface QuoteModalContextType {
    isOpen: boolean;
    selectedCar: string;
    triggerSource: string;
    openQuoteModal: (carName?: string, options?: QuoteModalOptions) => void;
    closeQuoteModal: () => void;
}

const QuoteModalContext = createContext<QuoteModalContextType | undefined>(undefined);

export function QuoteModalProvider({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedCar, setSelectedCar] = useState('');
    const [triggerSource, setTriggerSource] = useState('quote_modal');

    const openQuoteModal = (carName?: string, options?: QuoteModalOptions) => {
        setSelectedCar(carName || '');
        setTriggerSource(options?.source || 'quote_modal');
        setIsOpen(true);
    };

    const closeQuoteModal = () => {
        setIsOpen(false);
        setSelectedCar('');
        setTriggerSource('quote_modal');
    };

    return (
        <QuoteModalContext.Provider value={{ isOpen, selectedCar, triggerSource, openQuoteModal, closeQuoteModal }}>
            {children}
            {isOpen && (
                <ModalWrapper isOpen={isOpen} onClose={closeQuoteModal}>
                    <LeadFormModal 
                        title="Nhận Báo Giá Chi Tiết" 
                        onClose={closeQuoteModal} 
                        selectedCar={selectedCar} 
                        leadType="quote"
                        triggerSource={triggerSource}
                    />
                </ModalWrapper>
            )}
        </QuoteModalContext.Provider>
    );
}

export function useQuoteModal() {
    const context = useContext(QuoteModalContext);
    if (!context) {
        throw new Error('useQuoteModal must be used within a QuoteModalProvider');
    }
    return context;
}
