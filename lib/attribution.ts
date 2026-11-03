/**
 * Quản lý Attribution (First Touch, Last Touch, Conversion Context)
 * và trạng thái hiển thị Smart Lead Popup (Cookie 30p, sessionStorage).
 */

export interface AttributionData {
  gclid?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_term?: string | null;
  utm_content?: string | null;
  landing_page?: string | null;
  referrer?: string | null;
  timestamp?: string | null;
}

const FIRST_TOUCH_KEY = 'vfxm_first_touch';
const LAST_TOUCH_KEY = 'vfxm_last_touch';
const POPUP_SEEN_SESSION_KEY = 'vfxm_smart_popup_seen';
const POPUP_SEEN_COOKIE_NAME = 'vfxm_popup_seen';

/**
 * Đọc Cookie an toàn
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  try {
    const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
    return match ? decodeURIComponent(match[3]) : null;
  } catch {
    return null;
  }
}

/**
 * Ghi Cookie an toàn (mặc định 30 phút cho popup)
 */
export function setCookie(name: string, value: string, maxAgeSeconds: number = 1800): void {
  if (typeof document === 'undefined') return;
  try {
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; max-age=${maxAgeSeconds}; path=/; SameSite=Lax`;
  } catch (e) {
    console.warn('[Attribution] Failed to set cookie:', e);
  }
}

/**
 * Kiểm tra xem khách đã xem popup trong 30 phút qua chưa
 */
export function hasSeenPopup(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    // 1. Kiểm tra Cookie 30 phút
    if (getCookie(POPUP_SEEN_COOKIE_NAME) === '1') {
      return true;
    }
    // 2. Kiểm tra sessionStorage trong tab
    if (sessionStorage.getItem(POPUP_SEEN_SESSION_KEY) === 'true') {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Đánh dấu đã hiển thị popup (Cookie 30 phút & sessionStorage)
 */
export function markPopupSeen(): void {
  if (typeof window === 'undefined') return;
  try {
    setCookie(POPUP_SEEN_COOKIE_NAME, '1', 1800);
    sessionStorage.setItem(POPUP_SEEN_SESSION_KEY, 'true');
  } catch (e) {
    console.warn('[Attribution] Failed to mark popup seen:', e);
  }
}

/**
 * Khởi tạo và ghi nhận Attribution khi khách vào trang web
 */
export function initAttribution(searchParams: URLSearchParams, pathname: string): void {
  if (typeof window === 'undefined') return;

  try {
    const gclid = searchParams.get('gclid');
    const utm_source = searchParams.get('utm_source');
    const utm_medium = searchParams.get('utm_medium');
    const utm_campaign = searchParams.get('utm_campaign');
    const utm_term = searchParams.get('utm_term');
    const utm_content = searchParams.get('utm_content');

    const hasTrackingParams = Boolean(gclid || utm_source || utm_medium || utm_campaign || utm_term || utm_content);

    const nowIso = new Date().toISOString();
    const currentUrl = window.location.href;
    const referrer = typeof document !== 'undefined' ? document.referrer : '';

    // 1. Xử lý First Touch (Chỉ ghi một lần đầu tiên)
    const existingFirstTouch = sessionStorage.getItem(FIRST_TOUCH_KEY);
    if (!existingFirstTouch) {
      const firstTouchData: AttributionData = {
        gclid: gclid || null,
        utm_source: utm_source || (hasTrackingParams ? null : (referrer ? 'referral' : 'direct')),
        utm_medium: utm_medium || (hasTrackingParams ? null : (referrer ? 'referral' : 'none')),
        utm_campaign: utm_campaign || null,
        utm_term: utm_term || null,
        utm_content: utm_content || null,
        landing_page: currentUrl,
        referrer: referrer || null,
        timestamp: nowIso,
      };
      sessionStorage.setItem(FIRST_TOUCH_KEY, JSON.stringify(firstTouchData));
    }

    // 2. Xử lý Last Touch (Cập nhật nếu có tham số chiến dịch mới)
    if (hasTrackingParams) {
      const lastTouchData: AttributionData = {
        gclid: gclid || null,
        utm_source: utm_source || null,
        utm_medium: utm_medium || null,
        utm_campaign: utm_campaign || null,
        utm_term: utm_term || null,
        utm_content: utm_content || null,
        landing_page: currentUrl,
        referrer: referrer || null,
        timestamp: nowIso,
      };
      sessionStorage.setItem(LAST_TOUCH_KEY, JSON.stringify(lastTouchData));
    }
  } catch (err) {
    console.warn('[Attribution] Init error:', err);
  }
}

/**
 * Trích xuất toàn bộ dữ liệu Attribution hiện hành phục vụ gửi form
 */
export function getAttributionForLead(): {
  firstTouch: AttributionData | null;
  lastTouch: AttributionData | null;
  sourceUrl: string;
  notesSummary: string;
} {
  let firstTouch: AttributionData | null = null;
  let lastTouch: AttributionData | null = null;
  let sourceUrl = typeof window !== 'undefined' ? window.location.href : '';

  if (typeof window !== 'undefined') {
    try {
      const ftRaw = sessionStorage.getItem(FIRST_TOUCH_KEY);
      if (ftRaw) firstTouch = JSON.parse(ftRaw);

      const ltRaw = sessionStorage.getItem(LAST_TOUCH_KEY);
      if (ltRaw) lastTouch = JSON.parse(ltRaw);
    } catch (e) {
      console.warn('[Attribution] Read error:', e);
    }
  }

  // Tạo tóm tắt Attribution để lưu vào notes metadata
  const lines: string[] = [];
  if (firstTouch) {
    const parts = [];
    if (firstTouch.gclid) parts.push(`GCLID: ${firstTouch.gclid}`);
    if (firstTouch.utm_source) parts.push(`Source: ${firstTouch.utm_source}`);
    if (firstTouch.utm_medium) parts.push(`Medium: ${firstTouch.utm_medium}`);
    if (firstTouch.utm_campaign) parts.push(`Campaign: ${firstTouch.utm_campaign}`);
    if (firstTouch.utm_term) parts.push(`Term: ${firstTouch.utm_term}`);
    if (firstTouch.landing_page) parts.push(`Landing: ${firstTouch.landing_page}`);
    if (parts.length > 0) {
      lines.push(`[First Touch] ${parts.join(' | ')}`);
    }
  }

  if (lastTouch && JSON.stringify(lastTouch) !== JSON.stringify(firstTouch)) {
    const parts = [];
    if (lastTouch.gclid) parts.push(`GCLID: ${lastTouch.gclid}`);
    if (lastTouch.utm_source) parts.push(`Source: ${lastTouch.utm_source}`);
    if (lastTouch.utm_medium) parts.push(`Medium: ${lastTouch.utm_medium}`);
    if (lastTouch.utm_campaign) parts.push(`Campaign: ${lastTouch.utm_campaign}`);
    if (parts.length > 0) {
      lines.push(`[Last Touch] ${parts.join(' | ')}`);
    }
  }

  return {
    firstTouch,
    lastTouch,
    sourceUrl,
    notesSummary: lines.join('\n'),
  };
}

