/**
 * BOS CRM Backend Secondary Synchronization Client (Server-Side Only)
 * 
 * System: BOS System – VinFast Xanh Mekong
 * Gateway: https://gateway.vinfastmekong.vn
 * Documentation: https://gateway.vinfastmekong.vn/documentation
 * 
 * Architecture Principle:
 * - Supabase is the PRIMARY database and source of truth for website leads.
 * - BOS CRM is an ADDITIONAL secondary synchronization destination.
 * - BOS CRM never replaces Supabase and is not a gatekeeper.
 * - A failure or timeout in BOS CRM must NEVER roll back or invalidate a successful Supabase lead.
 */

import { supabase } from './supabase';
import type { LeadAttributionPayload } from '../app/actions/lead';

export interface BosCustomerResult {
  customerId: number;
  isExisting: boolean;
}

export interface BosLeadInput {
  websiteLeadId: string;
  customerName: string;
  phone: string;
  leadType: 'quote' | 'test_drive' | 'service_booking' | 'contact';
  carModel?: string;
  notes?: string;
  email?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  sourceUrl?: string;
  submissionId?: string;
  attribution?: LeadAttributionPayload;
  attributionNotes?: string;
}

export interface BosLeadResult {
  success: boolean;
  leadId?: string;
  customerId?: number;
  isRetry?: boolean;
  isExisting?: boolean;
  isUnfixable?: boolean;
  error?: string;
}

export interface BosSyncResult {
  status: 'SUCCESS' | 'DUPLICATE_30D' | 'FAILED' | 'FAILED_FATAL' | 'SKIPPED_BACKOFF';
  bosLeadId?: string;
  bosCustomerId?: number;
  attempt?: number;
  error?: string;
}

// ── 1. CONFIG & CREDENTIAL ACCESS (SERVER-SIDE ONLY) ──────────────────────────

function getBosConfig() {
  const apiUrl = (
    process.env.BOS_API_URL ||
    process.env.BOS_GATEWAY_URL ||
    'https://gateway.vinfastmekong.vn'
  ).replace(/\/+$/, '');

  const username = (
    process.env.BOS_USERNAME ||
    process.env.USERNAME_GATEWAY ||
    process.env.username_gateway ||
    ''
  ).trim();

  const password = (
    process.env.BOS_PASSWORD ||
    process.env.PASSWORD_GATEWAY ||
    process.env.password_gateway ||
    ''
  ).trim();

  return { apiUrl, username, password };
}

// ── 2. TOKEN LIFECYCLE & IN-MEMORY CACHE ──────────────────────────────────────

interface CachedTokenState {
  token: string;
  expiresAt: number; // Unix timestamp in ms
}

let tokenState: CachedTokenState | null = null;
let activeAuthPromise: Promise<string> | null = null;

/**
 * Lấy Access Token từ bộ nhớ đệm hoặc gọi POST /api/v1/auth/login.
 * Tái sử dụng nếu token còn hạn tối thiểu 60 giây.
 * Cơ chế Promise lock ngăn ngừa gọi login đồng thời.
 */
export async function getBosAccessToken(): Promise<string> {
  const now = Date.now();
  if (tokenState && tokenState.expiresAt - now > 60 * 1000) {
    return tokenState.token;
  }

  if (activeAuthPromise) {
    return activeAuthPromise;
  }

  activeAuthPromise = (async () => {
    try {
      const { apiUrl, username, password } = getBosConfig();

      if (!username || !password) {
        throw new Error('Chưa cấu hình thông tin đăng nhập BOS CRM trên máy chủ (BOS_USERNAME / BOS_PASSWORD).');
      }

      const res = await fetch(`${apiUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ username, password }),
        cache: 'no-store',
      });

      if (!res.ok) {
        throw new Error(`Đăng nhập BOS CRM thất bại với mã trạng thái HTTP ${res.status}.`);
      }

      const data = await res.json().catch(() => null);
      const accessToken = data?.data?.accessToken;

      if (!accessToken || typeof accessToken !== 'string') {
        throw new Error('Phản hồi từ BOS login không chứa accessToken hợp lệ.');
      }

      let expiresInMs = 14 * 60 * 1000;
      try {
        const parts = accessToken.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
          if (payload.exp && typeof payload.exp === 'number') {
            expiresInMs = Math.max(0, payload.exp * 1000 - Date.now());
          }
        }
      } catch {
        // Fallback default
      }

      tokenState = {
        token: accessToken,
        expiresAt: Date.now() + expiresInMs,
      };

      return accessToken;
    } finally {
      activeAuthPromise = null;
    }
  })();

  return activeAuthPromise;
}

/**
 * Xóa cache token khi gặp lỗi 401 Unauthorized hoặc cần re-login.
 */
export function invalidateBosToken(): void {
  tokenState = null;
  activeAuthPromise = null;
}

// ── 3. DATA NORMALIZATION HELPERS ─────────────────────────────────────────────

/**
 * Chuẩn hóa số điện thoại theo định dạng chuẩn Việt Nam: ^(0|\+84)[0-9]{9,10}$
 */
export function normalizePhone(rawPhone: string): string {
  let clean = (rawPhone || '').replace(/[\s\.\-\(\)]/g, '');
  if (clean.startsWith('+84')) {
    clean = '0' + clean.slice(3);
  } else if (clean.startsWith('84') && clean.length > 9) {
    clean = '0' + clean.slice(2);
  }
  if (!clean.startsWith('0') && clean.length === 9) {
    clean = '0' + clean;
  }
  return clean;
}

/**
 * Danh mục Model xe chuẩn từ BOS Catalog (GET /api/v1/catalog/models)
 */
const BOS_MODEL_CATALOG: { id: number; name: string; aliases: string[] }[] = [
  { id: 1, name: 'VinFast VF 3', aliases: ['vf 3', 'vf3'] },
  { id: 2, name: 'VinFast VF 5 Plus', aliases: ['vf 5', 'vf5'] },
  { id: 3, name: 'VinFast VF 6', aliases: ['vf 6', 'vf6'] },
  { id: 4, name: 'VinFast VF 7', aliases: ['vf 7', 'vf7'] },
  { id: 5, name: 'VinFast VF 8', aliases: ['vf 8', 'vf8'] },
  { id: 6, name: 'VinFast VF 9', aliases: ['vf 9', 'vf9'] },
  { id: 7, name: 'VinFast VF e34', aliases: ['e34', 'vf e34', 'vfe34'] },
  { id: 15, name: 'VinFast VF Wild (Bán Tải Điện)', aliases: ['wild', 'vf wild'] },
  { id: 16, name: 'VinFast EC Van (Thương Mại)', aliases: ['ec van', 'van'] },
  { id: 17, name: 'VinFast Minio Green (Đô Thị)', aliases: ['minio'] },
];

/**
 * Đối chiếu chuỗi tên xe từ form với Model ID và Version trong CRM
 */
export function matchCarModel(carModel?: string): {
  modelId?: number;
  desiredModel?: string;
  desiredVersion?: string;
} {
  if (!carModel) return {};

  const lower = carModel.toLowerCase();
  for (const item of BOS_MODEL_CATALOG) {
    if (item.aliases.some(alias => lower.includes(alias))) {
      let desiredVersion: string | undefined;
      if (lower.includes('plus')) desiredVersion = 'Plus';
      else if (lower.includes('eco')) desiredVersion = 'Eco';
      else if (lower.includes('base')) desiredVersion = 'Base';
      else if (lower.includes('s')) desiredVersion = 'S';

      return {
        modelId: item.id,
        desiredModel: item.name,
        desiredVersion,
      };
    }
  }

  return { desiredModel: carModel.trim() };
}

/**
 * Ánh xạ nguồn khách hàng (source) dựa trên dữ liệu Attribution tiếp thị
 */
export function mapAttributionSource(attribution?: LeadAttributionPayload, sourceUrl?: string): string {
  const touch = attribution?.lastTouch || attribution?.firstTouch;

  if (touch) {
    if (touch.gclid) {
      return 'Google Ads';
    }

    const utmSource = (touch.utm_source || '').toLowerCase();
    const utmMedium = (touch.utm_medium || '').toLowerCase();

    if (utmSource.includes('google')) {
      if (utmMedium.includes('cpc') || utmMedium.includes('paid') || utmMedium.includes('ads')) {
        return 'Google Ads';
      }
      return 'Google Search';
    }

    if (utmSource.includes('facebook') || utmSource.includes('fb')) {
      if (utmMedium.includes('cpc') || utmMedium.includes('paid') || utmMedium.includes('ads')) {
        return 'Facebook Ads';
      }
      return 'Facebook';
    }

    if (utmSource.includes('tiktok')) {
      return 'Tiktok Lead Form';
    }

    if (utmSource.includes('zalo')) {
      return 'Zalo';
    }

    if (utmSource.includes('youtube')) {
      return 'YouTube';
    }

    if (touch.referrer) {
      const ref = touch.referrer.toLowerCase();
      if (ref.includes('google.com')) return 'Google Search';
      if (ref.includes('facebook.com') || ref.includes('fb.com')) return 'Facebook';
      if (ref.includes('tiktok.com')) return 'Tiktok Lead Form';
      if (ref.includes('zalo.me')) return 'Zalo';
    }
  }

  if (sourceUrl && sourceUrl.toLowerCase().includes('khuyen-mai')) {
    return 'Website vinfastmekong.vn';
  }

  return 'Website vinfastmekong.vn';
}

/**
 * Xây dựng nội dung Notes có cấu trúc chi tiết cho BOS CRM
 */
export function buildBosNotes(input: BosLeadInput): string {
  const sections: string[] = [];

  switch (input.leadType) {
    case 'quote':
      sections.push('[LOẠI FORM: NHẬN BÁO GIÁ]');
      break;
    case 'test_drive':
      sections.push('[LOẠI FORM: ĐĂNG KÝ LÁI THỬ]');
      break;
    case 'service_booking':
      sections.push('[LOẠI FORM: ĐẶT LỊCH DỊCH VỤ / BẢO DƯỠNG]');
      break;
    default:
      sections.push('[LOẠI FORM: LIÊN HỆ TƯ VẤN]');
      break;
  }

  sections.push(`[Website Lead ID: ${input.websiteLeadId}]`);

  if (input.carModel) {
    sections.push(`Xe quan tâm: ${input.carModel}`);
  }

  if (input.appointmentDate || input.appointmentTime) {
    const timeParts = [];
    if (input.appointmentDate) timeParts.push(`Ngày hẹn: ${input.appointmentDate}`);
    if (input.appointmentTime) timeParts.push(`Giờ hẹn: ${input.appointmentTime}`);
    sections.push(timeParts.join(' | '));
  }

  if (input.email) {
    sections.push(`Email: ${input.email}`);
  }

  if (input.notes) {
    sections.push(`Chi tiết yêu cầu: ${input.notes}`);
  }

  if (input.submissionId) {
    sections.push(`Submission ID: ${input.submissionId}`);
  }

  if (input.sourceUrl) {
    sections.push(`Trang gửi: ${input.sourceUrl}`);
  }

  if (input.attribution?.notesSummary) {
    sections.push(`--- THÔNG TIN TIẾP THỊ (ATTRIBUTION) ---\n${input.attribution.notesSummary}`);
  } else if (input.attributionNotes) {
    sections.push(`--- THÔNG TIN TIẾP THỊ (ATTRIBUTION) ---\n${input.attributionNotes}`);
  }

  return sections.join('\n');
}

/**
 * Bảo toàn Notes của Supabase và cập nhật/thay thế dòng trạng thái [BOS Sync: ...]
 * Giữ nguyên 100% dữ liệu tư vấn, thông tin xe, SĐT gốc, UTM và mọi chỉnh sửa của Admin.
 */
export function appendOrUpdateBosSyncNote(currentNotes: string | null | undefined, newSyncNote: string): string {
  const trimmed = (currentNotes || '').trim();
  // Tìm kiếm khối [BOS Sync: ...] hiện tại (nếu có)
  const bosRegex = /\n*\[BOS Sync:[^\]]+\]/gi;
  if (bosRegex.test(trimmed)) {
    const cleaned = trimmed.replace(bosRegex, '').trimEnd();
    return cleaned ? `${cleaned}\n${newSyncNote}` : newSyncNote;
  }
  return trimmed ? `${trimmed}\n${newSyncNote}` : newSyncNote;
}

// ── 4. CUSTOMER RESOLUTION (SEARCH & REUSE OR CREATE) ─────────────────────────

/**
 * Xác định hồ sơ khách hàng trên BOS CRM:
 * 1. Tra cứu theo SĐT đã chuẩn hóa.
 * 2. Nếu tìm thấy khách hàng trùng SĐT -> Tái sử dụng customerId.
 * 3. Nếu chưa có -> Tạo khách hàng mới (POST /api/v1/crm/customers).
 */
export async function resolveBosCustomer(
  name: string,
  normalizedPhone: string,
  token: string
): Promise<BosCustomerResult> {
  const { apiUrl } = getBosConfig();

  // 1. Tìm kiếm khách hàng theo SĐT
  try {
    const searchUrl = `${apiUrl}/api/v1/crm/customers?search=${encodeURIComponent(normalizedPhone)}&limit=10`;
    const searchRes = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });

    if (searchRes.ok) {
      const searchData = await searchRes.json();
      if (Array.isArray(searchData?.data)) {
        const exactMatch = searchData.data.find(
          (c: any) => normalizePhone(c.phone || '') === normalizedPhone
        );
        if (exactMatch && exactMatch.id) {
          return { customerId: parseInt(exactMatch.id, 10), isExisting: true };
        }
      }
    } else if (searchRes.status === 401) {
      invalidateBosToken();
    }
  } catch (searchErr) {
    console.warn('[BOS CRM] Search customer warning:', searchErr);
  }

  // 2. Tạo mới khách hàng
  const createRes = await fetch(`${apiUrl}/api/v1/crm/customers`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      name: name.trim() || 'Khách hàng',
      phone: normalizedPhone,
      customerType: 'INDIVIDUAL',
    }),
    cache: 'no-store',
  });

  const createData = await createRes.json().catch(() => null);

  if (createRes.ok && createData?.data?.id) {
    return { customerId: parseInt(createData.data.id, 10), isExisting: false };
  }

  // Xử lý race condition: kiểm tra lại lần 2
  try {
    const retryUrl = `${apiUrl}/api/v1/crm/customers?search=${encodeURIComponent(normalizedPhone)}&limit=10`;
    const retryRes = await fetch(retryUrl, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
      cache: 'no-store',
    });

    if (retryRes.ok) {
      const retryData = await retryRes.json();
      if (Array.isArray(retryData?.data)) {
        const exactMatch = retryData.data.find(
          (c: any) => normalizePhone(c.phone || '') === normalizedPhone
        );
        if (exactMatch && exactMatch.id) {
          return { customerId: parseInt(exactMatch.id, 10), isExisting: true };
        }
      }
    }
  } catch (retryErr) {
    console.warn('[BOS CRM] Retry search customer warning:', retryErr);
  }

  const errorMessage = createData?.error?.message || 'Không thể tạo hồ sơ khách hàng trên CRM.';
  throw new Error(errorMessage);
}

// ── 5. IDEMPOTENT LEAD CHECK (PREVENT DUPLICATES ON RETRY / TIMEOUT) ─────────

/**
 * Kiểm tra xem lead này đã được tạo thành công trên BOS CRM trước đó hay chưa
 * (đặc biệt khi xảy ra network timeout hoặc retry).
 */
export async function findExistingBosLead(
  normalizedPhone: string,
  websiteLeadId: string,
  submissionId: string | undefined,
  token: string
): Promise<{ leadId: string; customerId?: number } | null> {
  const { apiUrl } = getBosConfig();

  try {
    const searchUrl = `${apiUrl}/api/v1/crm/leads?search=${encodeURIComponent(normalizedPhone)}&limit=10`;
    const res = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (!Array.isArray(data?.data)) return null;

    for (const item of data.data) {
      const notes = item.notes || '';
      if (websiteLeadId && notes.includes(`[Website Lead ID: ${websiteLeadId}]`)) {
        return { leadId: String(item.id), customerId: item.customerId };
      }
      if (submissionId && notes.includes(`Submission ID: ${submissionId}`)) {
        return { leadId: String(item.id), customerId: item.customerId };
      }
    }
  } catch (err) {
    console.warn('[BOS CRM] Check existing lead warning:', err);
  }

  return null;
}

// ── 6. CREATE BOS LEAD ────────────────────────────────────────────────────────

/**
 * Tạo Lead trên BOS CRM với kiểm tra trùng lặp và idempotency.
 */
export async function createBosLead(input: BosLeadInput): Promise<BosLeadResult> {
  const { apiUrl } = getBosConfig();

  // Step 1: Lấy token xác thực
  let token: string;
  try {
    token = await getBosAccessToken();
  } catch (authErr: any) {
    console.error('[BOS CRM] Auth error:', authErr.message);
    return {
      success: false,
      error: 'Không thể xác thực với máy chủ CRM (BOS Authentication Failed).',
    };
  }

  const normalizedPhone = normalizePhone(input.phone);

  // Step 2: Idempotency check trước khi tạo: kiểm tra xem lead đã tồn tại trên CRM chưa
  const existingLead = await findExistingBosLead(
    normalizedPhone,
    input.websiteLeadId,
    input.submissionId,
    token
  );

  if (existingLead) {
    return {
      success: true,
      leadId: existingLead.leadId,
      customerId: existingLead.customerId,
      isExisting: true,
    };
  }

  // Step 3: Xác định hoặc tạo Customer
  let customerId: number;
  try {
    const customer = await resolveBosCustomer(input.customerName, normalizedPhone, token);
    customerId = customer.customerId;
  } catch (custErr: any) {
    console.error('[BOS CRM] Customer resolution error:', custErr.message);
    const isUnfixable = /invalid phone|sai định dạng/i.test(custErr.message);
    return {
      success: false,
      isUnfixable,
      error: `Không thể xử lý hồ sơ khách hàng: ${custErr.message}`,
    };
  }

  // Step 4: Ánh xạ Model, Version, Source, Interest Level
  const { modelId, desiredModel, desiredVersion } = matchCarModel(input.carModel);
  const source = mapAttributionSource(input.attribution, input.sourceUrl);

  let interestLevel: 'HOT' | 'WARM' | 'LEAD' = 'LEAD';
  if (input.leadType === 'test_drive' || input.leadType === 'quote') {
    interestLevel = 'HOT';
  } else if (input.leadType === 'service_booking') {
    interestLevel = 'WARM';
  }

  const notes = buildBosNotes(input);

  // Step 5: Chuẩn bị payload tạo Lead
  const leadPayload: Record<string, any> = {
    customerName: input.customerName.trim() || 'Khách hàng',
    phone: normalizedPhone,
    customerId,
    source,
    interestLevel,
    notes,
  };

  if (modelId) leadPayload.modelId = modelId;
  if (desiredModel) leadPayload.desiredModel = desiredModel;
  if (desiredVersion) leadPayload.desiredVersion = desiredVersion;

  // Step 6: Gửi request tạo Lead (timeout kiểm soát 5 giây)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    let res = await fetch(`${apiUrl}/api/v1/crm/leads`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(leadPayload),
      signal: controller.signal,
      cache: 'no-store',
    });

    clearTimeout(timeoutId);

    // Xử lý 401: Xóa cache token và thử lại 1 lần
    if (res.status === 401) {
      invalidateBosToken();
      token = await getBosAccessToken();

      const retryController = new AbortController();
      const retryTimeoutId = setTimeout(() => retryController.abort(), 5000);

      res = await fetch(`${apiUrl}/api/v1/crm/leads`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(leadPayload),
        signal: retryController.signal,
        cache: 'no-store',
      });

      clearTimeout(retryTimeoutId);
    }

    const resJson = await res.json().catch(() => null);

    if (res.ok && resJson?.success) {
      const createdLeadId = String(resJson.data?.id || '');
      return {
        success: true,
        leadId: createdLeadId,
        customerId,
        isRetry: false,
      };
    }

    // Xử lý kiểm soát trùng số điện thoại 30 ngày từ BOS Backend
    const errorMessage = resJson?.error?.message || '';
    const isDuplicate = res.status === 409 ||
      /trùng|30 ngày|tồn tại|duplicate/i.test(errorMessage);

    if (isDuplicate) {
      console.warn(`[BOS CRM] Phone ${normalizedPhone} duplicate detected within 30 days.`);
      return {
        success: true,
        leadId: 'duplicate_30d',
        customerId,
        isRetry: true,
      };
    }

    const isUnfixable = res.status === 400 && /validation|invalid|bắt buộc/i.test(errorMessage);

    return {
      success: false,
      isUnfixable,
      error: errorMessage || `Lỗi CRM (HTTP ${res.status}).`,
    };

  } catch (netErr: any) {
    const isTimeout = netErr.name === 'AbortError' || /abort|timeout/i.test(netErr.message);
    const msg = isTimeout ? 'Kết nối đến BOS CRM bị timeout sau 5 giây.' : `Lỗi mạng khi kết nối BOS CRM: ${netErr.message}`;
    console.error('[BOS CRM] Network/Timeout error:', msg);
    return {
      success: false,
      error: msg,
    };
  }
}

// ── 7. SECONDARY SYNCHRONIZATION RUNNER (NON-BLOCKING / SAFE) ────────────────

const MAX_RETRIES = 3;
const RETRY_BACKOFF_MS = [5 * 60 * 1000, 15 * 60 * 1000, 30 * 60 * 1000]; // 5m, 15m, 30m

/**
 * Thực hiện đồng bộ thứ cấp một Website Lead đã lưu Supabase sang BOS CRM.
 * 
 * NGUYÊN TẮC BẤT DI BẤT DỊCH:
 * - Được gọi SAU KHI Supabase lưu thành công.
 * - Thất bại hoặc timeout ở đây KHÔNG BAO GIỜ làm ảnh hưởng đến kết quả thành công của khách hàng.
 * - Trạng thái đồng bộ được cập nhật an toàn vào cột `notes` của Supabase bằng appendOrUpdateBosSyncNote.
 */
export async function syncLeadToBos(input: BosLeadInput, attemptNumber: number = 1): Promise<BosSyncResult> {
  try {
    const bosResult = await createBosLead(input);

    let syncStatusNote = '';
    let resultStatus: BosSyncResult['status'] = 'FAILED';

    if (bosResult.success) {
      if (bosResult.isRetry) {
        resultStatus = 'DUPLICATE_30D';
        syncStatusNote = `[BOS Sync: DUPLICATE_30D | SĐT đã tồn tại trên CRM trong 30 ngày | Customer ID: ${bosResult.customerId || 'N/A'} | Synced At: ${new Date().toISOString()}]`;
      } else {
        resultStatus = 'SUCCESS';
        syncStatusNote = `[BOS Sync: SUCCESS | BOS Lead ID: ${bosResult.leadId} | BOS Customer ID: ${bosResult.customerId || 'N/A'} | Synced At: ${new Date().toISOString()}]`;
      }
    } else {
      if (bosResult.isUnfixable) {
        resultStatus = 'FAILED_FATAL';
        syncStatusNote = `[BOS Sync: FAILED_FATAL | Error: ${bosResult.error || 'Dữ liệu không hợp lệ'} | Status: UNFIXABLE_DATA | Failed At: ${new Date().toISOString()}]`;
      } else if (attemptNumber >= MAX_RETRIES) {
        resultStatus = 'FAILED_FATAL';
        syncStatusNote = `[BOS Sync: FAILED_FATAL | Attempt: ${attemptNumber}/${MAX_RETRIES} | Error: ${bosResult.error || 'Quá số lần thử lại'} | Status: ABORTED | Failed At: ${new Date().toISOString()}]`;
      } else {
        resultStatus = 'FAILED';
        const backoffMs = RETRY_BACKOFF_MS[attemptNumber - 1] || 15 * 60 * 1000;
        const nextRetryAt = new Date(Date.now() + backoffMs).toISOString();
        syncStatusNote = `[BOS Sync: FAILED | Attempt: ${attemptNumber}/${MAX_RETRIES} | NextRetryAfter: ${nextRetryAt} | Error: ${bosResult.error || 'Unknown error'} | Status: PENDING_RETRY | Failed At: ${new Date().toISOString()}]`;
      }
    }

    // Cập nhật an toàn vào Supabase notes (Bảo toàn 100% dữ liệu gốc)
    try {
      const { data: currentLead } = await supabase
        .from('leads')
        .select('notes')
        .eq('id', input.websiteLeadId)
        .maybeSingle();

      if (currentLead) {
        const updatedNotes = appendOrUpdateBosSyncNote(currentLead.notes, syncStatusNote);
        await supabase
          .from('leads')
          .update({ notes: updatedNotes })
          .eq('id', input.websiteLeadId);
      }
    } catch (dbUpdateErr) {
      console.warn('[BOS Sync] Could not safely update sync status in Supabase:', dbUpdateErr);
    }

    return {
      status: resultStatus,
      bosLeadId: bosResult.leadId,
      bosCustomerId: bosResult.customerId,
      attempt: attemptNumber,
      error: bosResult.error,
    };

  } catch (err: any) {
    console.error('[BOS Sync] Unhandled exception in syncLeadToBos:', err.message);

    try {
      const syncStatusNote = `[BOS Sync: FAILED | Attempt: ${attemptNumber}/${MAX_RETRIES} | Exception: ${err.message} | Status: PENDING_RETRY | Failed At: ${new Date().toISOString()}]`;
      const { data: currentLead } = await supabase
        .from('leads')
        .select('notes')
        .eq('id', input.websiteLeadId)
        .maybeSingle();

      if (currentLead) {
        const updatedNotes = appendOrUpdateBosSyncNote(currentLead.notes, syncStatusNote);
        await supabase
          .from('leads')
          .update({ notes: updatedNotes })
          .eq('id', input.websiteLeadId);
      }
    } catch {
      // Bỏ qua lỗi ghi log DB
    }

    return {
      status: 'FAILED',
      attempt: attemptNumber,
      error: err.message,
    };
  }
}

// ── 8. AUTOMATIC RETRY ENGINE WITH EXPONENTIAL BACKOFF ───────────────────────

/**
 * Thử lại đồng bộ cho một lead cụ thể theo Supabase Lead ID.
 * - Đảm bảo Idempotent: Bỏ qua nếu đã SUCCESS hoặc FAILED_FATAL.
 * - Kiểm tra thời gian NextRetryAfter: Bỏ qua nếu chưa đến hạn.
 * - Đếm số lần attempt: Dừng nếu quá MAX_RETRIES (3 lần).
 */
export async function retryBosSyncForLead(leadId: string): Promise<BosSyncResult> {
  const { data: lead, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .maybeSingle();

  if (error || !lead) {
    return { status: 'FAILED_FATAL', error: 'Lead không tồn tại trong Supabase.' };
  }

  const notes = lead.notes || '';

  // 1. Idempotency: Nếu đã thành công, không gửi lại
  if (notes.includes('[BOS Sync: SUCCESS') || notes.includes('[BOS Sync: DUPLICATE_30D')) {
    return { status: 'SUCCESS', error: 'Lead này đã đồng bộ thành công trước đó.' };
  }

  // 2. Không thử lại nếu là lỗi bất khả kháng (FAILED_FATAL)
  if (notes.includes('[BOS Sync: FAILED_FATAL')) {
    return { status: 'FAILED_FATAL', error: 'Lead này mang lỗi không thể khắc phục tự động hoặc đã vượt quá số lần thử lại.' };
  }

  // 3. Phân tích số lần đã thử và kiểm tra Backoff
  let currentAttempt = 1;
  const attemptMatch = notes.match(/Attempt:\s*(\d+)\/(\d+)/i);
  if (attemptMatch && attemptMatch[1]) {
    currentAttempt = parseInt(attemptMatch[1], 10);
  }

  const nextAttempt = currentAttempt + 1;
  if (currentAttempt >= MAX_RETRIES) {
    const finalNote = `[BOS Sync: FAILED_FATAL | Reason: Max retries (${MAX_RETRIES}/${MAX_RETRIES}) reached | Status: ABORTED | Time: ${new Date().toISOString()}]`;
    const updatedNotes = appendOrUpdateBosSyncNote(notes, finalNote);
    await supabase.from('leads').update({ notes: updatedNotes }).eq('id', leadId);
    return { status: 'FAILED_FATAL', error: `Đã thử lại ${MAX_RETRIES} lần nhưng không thành công.` };
  }

  // Kiểm tra NextRetryAfter
  const nextRetryMatch = notes.match(/NextRetryAfter:\s*([0-9T:\-\.Z]+)/i);
  if (nextRetryMatch && nextRetryMatch[1]) {
    const nextRetryTime = new Date(nextRetryMatch[1]).getTime();
    if (Date.now() < nextRetryTime) {
      return { status: 'SKIPPED_BACKOFF', error: `Chưa đến thời hạn thử lại (Hẹn lúc: ${nextRetryMatch[1]}).` };
    }
  }

  // Trích xuất SĐT gốc nếu có
  let phone = String(lead.phone || '');
  const rawMatch = notes.match(/Raw Phone \(SĐT gốc\):\s*([0-9+]+)/i);
  if (rawMatch && rawMatch[1]) {
    phone = rawMatch[1].trim();
  }

  // Trích xuất submission_id nếu có
  const subMatch = notes.match(/Submission ID:\s*([a-zA-Z0-9_-]+)/i);
  const submissionId = subMatch ? subMatch[1].trim() : undefined;

  return syncLeadToBos({
    websiteLeadId: lead.id,
    customerName: lead.full_name || 'Khách hàng',
    phone,
    leadType: (lead.lead_type || 'quote') as any,
    carModel: lead.car_model || undefined,
    notes: lead.notes || undefined,
    email: lead.email || undefined,
    appointmentDate: lead.appointment_date || undefined,
    appointmentTime: lead.appointment_time || undefined,
    sourceUrl: lead.source_url || undefined,
    submissionId,
  }, nextAttempt);
}

/**
 * Quét tự động danh sách các leads đang ở trạng thái PENDING_RETRY và thực hiện thử lại có kiểm soát.
 * Giới hạn số lượng `limit` mỗi chu kỳ để bảo vệ API BOS Gateway.
 */
export async function retryPendingBosSync(limit: number = 10): Promise<{
  attempted: number;
  succeeded: number;
  failed: number;
  skippedBackoff: number;
  details: { leadId: string; status: BosSyncResult['status']; error?: string }[];
}> {
  const { data: pendingLeads } = await supabase
    .from('leads')
    .select('id, notes')
    .ilike('notes', '%[BOS Sync: FAILED%')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (!pendingLeads || pendingLeads.length === 0) {
    return { attempted: 0, succeeded: 0, failed: 0, skippedBackoff: 0, details: [] };
  }

  let succeeded = 0;
  let failed = 0;
  let skippedBackoff = 0;
  const details: { leadId: string; status: BosSyncResult['status']; error?: string }[] = [];

  for (const item of pendingLeads) {
    // Bỏ qua nếu sau đó đã thành công hoặc đã bị hủy
    if (item.notes && (item.notes.includes('[BOS Sync: SUCCESS') || item.notes.includes('[BOS Sync: FAILED_FATAL'))) {
      continue;
    }

    const res = await retryBosSyncForLead(item.id);
    details.push({ leadId: item.id, status: res.status, error: res.error });

    if (res.status === 'SUCCESS' || res.status === 'DUPLICATE_30D') {
      succeeded++;
    } else if (res.status === 'SKIPPED_BACKOFF') {
      skippedBackoff++;
    } else {
      failed++;
    }
  }

  return {
    attempted: details.length,
    succeeded,
    failed,
    skippedBackoff,
    details,
  };
}
