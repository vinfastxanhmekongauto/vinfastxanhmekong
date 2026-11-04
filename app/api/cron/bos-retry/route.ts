import { NextRequest, NextResponse } from 'next/server';
import { retryPendingBosSync } from '@/lib/bos-crm';

export const dynamic = 'force-dynamic';

/**
 * Vercel Cron / Automated Background Retry Endpoint for BOS CRM Synchronization.
 * 
 * Schedule: Configured in vercel.json (e.g. every 15 minutes)
 * Security: Protected by CRON_SECRET (Vercel standard Bearer token)
 */
async function handleRetry(req: NextRequest) {
  try {
    // 1. Kiểm tra xác thực bảo mật (FAIL-CLOSED: Bắt buộc cấu hình CRON_SECRET và Bearer token hợp lệ)
    const cronSecret = (process.env.CRON_SECRET || '').trim();
    const authHeader = req.headers.get('authorization');

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing or invalid authorization token.' },
        { status: 401 }
      );
    }

    // 2. Lấy tham số giới hạn (mặc định 10 leads/lần chạy, tối đa 20)
    const { searchParams } = new URL(req.url);
    const limitParam = parseInt(searchParams.get('limit') || '10', 10);
    const limit = Math.min(Math.max(1, isNaN(limitParam) ? 10 : limitParam), 20);

    // 3. Thực thi quét và thử lại có kiểm soát
    const result = await retryPendingBosSync(limit);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        attempted: result.attempted,
        succeeded: result.succeeded,
        failed: result.failed,
        skippedBackoff: result.skippedBackoff,
      },
      details: result.details,
    });

  } catch (error: any) {
    console.error('[BOS Cron Retry] Internal server error:', error.message);
    return NextResponse.json(
      { error: 'Internal server error while processing retry.', message: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return handleRetry(req);
}

export async function POST(req: NextRequest) {
  return handleRetry(req);
}

