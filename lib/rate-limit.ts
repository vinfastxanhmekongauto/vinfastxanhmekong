import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Configure Upstash Redis
const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

export const redis = (url && token) ? new Redis({ url, token }) : null;

// Rule 1: 5 attempts max in 5 minutes window
export const rateLimitShort = redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '5 m'),
    analytics: true,
    prefix: '@ratelimit/login-short'
}) : null;

// Rule 2: 8 attempts max in 15 minutes window (stricter long-term limit)
export const rateLimitLong = redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(8, '15 m'),
    analytics: true,
    prefix: '@ratelimit/login-long'
}) : null;

export async function checkRateLimit(ip: string) {
    if (!redis || !rateLimitLong || !rateLimitShort) {
        return { success: true, message: null };
    }

    // Check long-term block first
    const longResult = await rateLimitLong.limit(ip);
    if (!longResult.success) {
        const resetMinutes = Math.ceil((longResult.reset - Date.now()) / 60000);
        return {
            success: false,
            message: `IP của bạn (${ip}) đang bị tạm khóa. Vui lòng quay lại sau ${resetMinutes} phút.`
        };
    }

    // Check short-term block
    const shortResult = await rateLimitShort.limit(ip);
    if (!shortResult.success) {
        const resetMinutes = Math.ceil((shortResult.reset - Date.now()) / 60000);
        return {
            success: false,
            message: `IP của bạn (${ip}) đang bị tạm khóa. Vui lòng quay lại sau ${resetMinutes} phút.`
        };
    }

    return { success: true, message: null };
}
