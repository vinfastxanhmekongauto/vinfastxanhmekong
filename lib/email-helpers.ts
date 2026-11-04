import { FALLBACK_EMAIL } from './constants';

/**
 * Regex kiểm tra định dạng email theo chuẩn cơ bản (RFC 5322 compatible):
 * Bắt buộc có phần user, dấu @, và domain có ít nhất một dấu chấm với phần mở rộng.
 */
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/**
 * Phân tích và chuẩn hóa chuỗi cấu hình email người nhận từ biến môi trường.
 * 
 * Quy tắc xử lý:
 * 1. Phân tách theo dấu phẩy (`,`)
 * 2. Cắt bỏ khoảng trắng dư thừa ở đầu và cuối mỗi email
 * 3. Loại bỏ các phần tử rỗng hoặc chỉ có khoảng trắng
 * 4. Loại bỏ các email trùng lặp (không phân biệt hoa/thường, bảo toàn chuỗi email ban đầu)
 * 5. Xác thực định dạng email hợp lệ
 * 6. Xử lý an toàn: Nếu không có email nào hợp lệ hoặc input rỗng, fallback về FALLBACK_EMAIL
 * 
 * @param rawEmails Chuỗi email thô (ví dụ: "a@x.com, b@y.com, c@z.com")
 * @returns Mảng danh sách các địa chỉ email hợp lệ, không trùng lặp
 */
export function parseAdminNotificationRecipients(rawEmails?: string | null): string[] {
  if (!rawEmails || typeof rawEmails !== 'string' || rawEmails.trim() === '') {
    return [FALLBACK_EMAIL];
  }

  const seen = new Set<string>();
  const validRecipients: string[] = [];

  const rawList = rawEmails.split(',');

  for (const item of rawList) {
    const trimmed = item.trim();
    if (!trimmed) continue;

    const lower = trimmed.toLowerCase();
    if (seen.has(lower)) {
      continue;
    }

    if (EMAIL_REGEX.test(trimmed)) {
      seen.add(lower);
      validRecipients.push(trimmed);
    } else {
      console.warn(`[Admin Notification Email] Bỏ qua địa chỉ email không hợp lệ: "${trimmed}"`);
    }
  }

  if (validRecipients.length === 0) {
    console.warn(`[Admin Notification Email] Không tìm thấy email hợp lệ trong ADMIN_EMAIL. Sử dụng FALLBACK_EMAIL: "${FALLBACK_EMAIL}"`);
    return [FALLBACK_EMAIL];
  }

  return validRecipients;
}

/**
 * Lấy danh sách email người nhận thông báo quản trị viên từ process.env.ADMIN_EMAIL.
 * Sử dụng một danh sách người nhận dùng chung cho toàn bộ các loại thông báo lead của website.
 */
export function getAdminNotificationRecipients(): string[] {
  return parseAdminNotificationRecipients(process.env.ADMIN_EMAIL);
}

/**
 * Định dạng danh sách người nhận thành tham số `to` cho Resend API:
 * - Nếu chỉ có 1 recipient: trả về string duy nhất (đảm bảo hành vi nguyên trạng 100%)
 * - Nếu có nhiều recipients: trả về mảng string[] để Resend gửi trong 1 request duy nhất
 */
export function formatResendToField(recipients: string[]): string | string[] {
  if (!recipients || recipients.length === 0) {
    return FALLBACK_EMAIL;
  }
  return recipients.length === 1 ? recipients[0] : recipients;
}

