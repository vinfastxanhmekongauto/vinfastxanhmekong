'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useQuoteModal } from './QuoteModalProvider';
import { hasSeenPopup, markPopupSeen } from '@/lib/attribution';

interface SmartLeadPopupProps {
  products?: any[];
}

export default function SmartLeadPopup({ products = [] }: SmartLeadPopupProps) {
  const pathname = usePathname();
  const { openQuoteModal, isOpen } = useQuoteModal();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // 1. Hàm dọn dẹp timer hiện hành
    const clearActiveTimer = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    // Hủy ngay timer cũ khi pathname thay đổi hoặc modal mở
    clearActiveTimer();

    // 2. Kiểm tra route cho phép: chỉ Trang chủ ('/') hoặc Trang chi tiết xe ('/o-to-dien/[slug]')
    const isHome = pathname === '/';
    const isCarDetail = pathname.startsWith('/o-to-dien/') && pathname !== '/o-to-dien';
    if (!isHome && !isCarDetail) return;

    // 3. Xác định dòng xe mặc định
    let targetCarName = '';
    if (isCarDetail) {
      const slug = pathname.replace('/o-to-dien/', '').split('/')[0].split('?')[0];
      const matched = products.find((p: any) => p.slug === slug || p.id === slug);
      if (matched && matched.name) {
        targetCarName = matched.name;
      } else {
        // Fallback nhận diện theo slug
        const upper = slug.toUpperCase().replace('VINFAST-', '').replace('-', ' ');
        targetCarName = upper ? `VinFast ${upper}` : '';
      }
    }

    // 4. Lắng nghe BroadcastChannel để nhận tin hủy timer nếu tab khác mở popup
    let channel: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        channel = new BroadcastChannel('vfxm_popup_channel');
        channel.onmessage = (event) => {
          if (event.data?.type === 'POPUP_DISPLAYED') {
            clearActiveTimer();
          }
        };
      }
    } catch {
      // Bỏ qua nếu môi trường không hỗ trợ
    }

    // 5. Hàm thực thi xin Web Lock và kích hoạt mở modal
    const executeWebLockAndOpen = async () => {
      // Guard kiểm tra môi trường an toàn
      if (typeof document === 'undefined' || typeof navigator === 'undefined') return;

      // Fail-Closed: Nếu không hỗ trợ Web Locks API, không tự động mở popup để tránh mở trùng đa tab
      if (!('locks' in navigator)) {
        return;
      }

      // Pre-check trước khi xin lock
      if (document.visibilityState !== 'visible' || hasSeenPopup() || isOpen) {
        return;
      }

      try {
        await navigator.locks.request('vfxm_smart_popup_lock', { ifAvailable: true }, async (lock) => {
          // Nếu không lấy được khóa (đang có tab khác chiếm), từ chối và thoát
          if (!lock) return;

          // Double-check bên trong Lock callback
          if (document.visibilityState !== 'visible') return;
          if (hasSeenPopup()) return;
          if (isOpen || (document.body && document.body.style.overflow === 'hidden')) return;

          // Re-check pathname vẫn thuộc phạm vi cho phép
          const currentPath = window.location.pathname;
          const stillHome = currentPath === '/';
          const stillCarDetail = currentPath.startsWith('/o-to-dien/') && currentPath !== '/o-to-dien';
          if (!stillHome && !stillCarDetail) return;

          // EAGER COMMIT: Ghi nhận trạng thái đã xem vào Cookie 30p & sessionStorage trước khi mở UI
          markPopupSeen();

          // Phát thông điệp qua BroadcastChannel để các tab khác hủy timer sớm
          try {
            if (channel) {
              channel.postMessage({ type: 'POPUP_DISPLAYED', timestamp: Date.now() });
            }
          } catch {
            // Không làm gián đoạn nếu BroadcastChannel gặp lỗi
          }

          // Gọi hàm mở modal (Caller role - không tự gửi GA4 view_quote_form)
          openQuoteModal(targetCarName, { source: 'smart_popup' });
        });
      } catch (err) {
        console.warn('[SmartLeadPopup] Web Lock execution error:', err);
      }
    };

    // 6. Hàm thiết lập timer 7 giây có kiểm tra an toàn
    const scheduleTimer = () => {
      clearActiveTimer();

      // Trường hợp B: Tab đang ở hidden -> Không tạo timer
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        return;
      }

      // Kiểm tra modal đang mở hoặc đã xem
      if (isOpen || hasSeenPopup()) {
        return;
      }

      // Khởi động timer 7 giây
      timerRef.current = setTimeout(() => {
        executeWebLockAndOpen();
      }, 7000);
    };

    // 7. Lắng nghe Visibility State (Trường hợp C & D)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Trường hợp C: Tab đang đếm nhưng chuyển sang hidden -> Hủy timer ngay lập tức
        clearActiveTimer();
      } else if (document.visibilityState === 'visible') {
        // Trường hợp D: Tab từ hidden chuyển sang visible -> Bắt đầu lại chu kỳ 7s từ đầu
        scheduleTimer();
      }
    };

    // Khởi động nếu đang visible (Trường hợp A)
    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
      scheduleTimer();
    }

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      clearActiveTimer();
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
      if (channel) {
        channel.close();
      }
    };
  }, [pathname, isOpen, products, openQuoteModal]);

  return null;
}

