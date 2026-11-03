export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-X8LZPZ2L00';

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

/**
 * Gửi sự kiện tới Google Analytics 4 (GA4) an toàn từ Client-side.
 * Có cơ chế guard kiểm tra môi trường trình duyệt và hàm window.gtag.
 */
export function sendGAEvent(eventName: string, params?: Record<string, any>): void {
  if (typeof window === 'undefined') return;

  try {
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, params);
      if (process.env.NODE_ENV === 'development') {
        console.log(`[GA4 Event] ${eventName}`, params);
      }
    } else if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push({
        event: eventName,
        ...params,
      });
      if (process.env.NODE_ENV === 'development') {
        console.log(`[GA4 DataLayer Event] ${eventName}`, params);
      }
    }
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[GA4 Error] Failed to send event ${eventName}:`, err);
    }
  }
}

