'use client';

import React, { createContext, useContext } from 'react';
import useSWR from 'swr';

export interface SiteSettings {
    phone?: string;
    email?: string;
    address?: string;
    google_maps_link?: string;
}

interface SiteSettingsContextType {
    settings: SiteSettings | null;
    isLoading: boolean;
    error: any;
}

const SiteSettingsContext = createContext<SiteSettingsContextType>({
    settings: null,
    isLoading: true,
    error: null,
});

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function SiteSettingsProvider({ children }: { children: React.ReactNode }) {
    const { data, error, isLoading } = useSWR('/api/settings', fetcher, {
        revalidateOnFocus: true, // Always fetch latest contact info when user returns to tab
        dedupingInterval: 60000, // 1 minute
    });

    const settings = data?.data || null;

    return (
        <SiteSettingsContext.Provider value={{ settings, isLoading, error }}>
            {children}
        </SiteSettingsContext.Provider>
    );
}

export function useSiteSettings() {
    return useContext(SiteSettingsContext);
}
