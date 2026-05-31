'use client';

import React, { createContext, useContext, useState } from 'react';
import { ModalWrapper, LeadFormModal } from './quick-action-modals';

interface QuoteModalContextType {
    isOpen: boolean;
    selectedCar: string;
    openQuoteModal: (carName?: string) => void;
    closeQuoteModal: () => void;
}

const QuoteModalContext = createContext<QuoteModalContextType | undefined>(undefined);

export function QuoteModalProvider({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedCar, setSelectedCar] = useState('');

    const openQuoteModal = (carName?: string) => {
        setSelectedCar(carName || '');
        setIsOpen(true);
    };

    const closeQuoteModal = () => {
        setIsOpen(false);
        setSelectedCar('');
    };

    return (
        <QuoteModalContext.Provider value={{ isOpen, selectedCar, openQuoteModal, closeQuoteModal }}>
            {children}
            <ModalWrapper isOpen={isOpen} onClose={closeQuoteModal}>
                <LeadFormModal 
                    title="Nhận Báo Giá Chi Tiết" 
                    onClose={closeQuoteModal} 
                    selectedCar={selectedCar} 
                />
            </ModalWrapper>
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
