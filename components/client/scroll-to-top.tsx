'use client';

import { useEffect } from 'react';

/**
 * Invisible client component that forces the browser scroll position
 * to the very top on mount. This prevents the auto-scroll bug caused
 * by layout shifts, focused elements, or hash fragments on navigation.
 */
export default function ScrollToTop() {
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }, []);

    return null;
}
