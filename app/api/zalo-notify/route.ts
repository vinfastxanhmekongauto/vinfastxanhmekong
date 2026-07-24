import { NextResponse } from 'next/server';

async function fetchWithRetry(url: string, options: RequestInit, retries = 3, delay = 1000): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    const response = await fetch(url, options);
    if (response.status === 429) {
      console.warn(`[Zalo API] Rate limited (429). Retrying attempt ${i + 1}/${retries} in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      continue;
    }
    return response;
  }
  throw new Error("Exceeded maximum retries for Zalo API connection.");
}

export async function POST(request: Request) {
  try {
    // 1. Parse request body
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid JSON request body.' },
        { status: 400 }
      );
    }

    const { name, phone, serviceType, notes } = body || {};

    if (!phone && !name) {
      return NextResponse.json(
        { error: 'Missing required fields: name or phone.' },
        { status: 400 }
      );
    }

    // 2. Retrieve environment variables
    const rawUserIds = process.env.ZALO_CS_USER_ID || '';
    const accessToken = process.env.ZALO_ACCESS_TOKEN || '';

    const csUserIds = rawUserIds
      .split(',')
      .map(id => id.trim())
      .filter(id => id.length > 0);

    if (csUserIds.length === 0) {
      console.error('ZALO_CS_USER_ID environment variable is missing or empty.');
      return NextResponse.json(
        { error: 'ZALO_CS_USER_ID is not configured.' },
        { status: 500 }
      );
    }

    if (!accessToken) {
      console.error('ZALO_ACCESS_TOKEN environment variable is missing.');
      return NextResponse.json(
        { error: 'ZALO_ACCESS_TOKEN is not configured.' },
        { status: 500 }
      );
    }

    // 3. Format message text
    const messageText = `🔔 CÓ KHÁCH HÀNG MỚI ĐĂNG KÝ!
👤 Họ tên: ${name || 'Chưa cung cấp'}
📞 SĐT: ${phone || 'Chưa cung cấp'}
📌 Dịch vụ: ${serviceType || 'Đăng ký dịch vụ/Lái thử'}${notes ? `\n📝 Ghi chú: ${notes}` : ''}`;

    // 4. Send Zalo OA message to each recipient in csUserIds
    const sendPromises = csUserIds.map(async (userId) => {
      const payload = {
        recipient: { user_id: userId },
        message: { text: messageText }
      };

      try {
        const response = await fetchWithRetry("https://openapi.zalo.me/v3.0/oa/message/cs", {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'access_token': accessToken
          },
          body: JSON.stringify(payload)
        });

        const zaloResult = await response.json();
        console.log("Zalo API Response:", zaloResult);

        const isSuccess = response.ok && (zaloResult.error === 0 || zaloResult.error === undefined);

        return { 
          userId, 
          ok: isSuccess, 
          status: response.status, 
          data: zaloResult,
          error: zaloResult.error !== 0 ? zaloResult.message || `Error code ${zaloResult.error}` : null
        };
      } catch (err: any) {
        console.error(`Failed to send Zalo notification to user ${userId}:`, err);
        return { userId, ok: false, error: err?.message || 'Network error' };
      }
    });

    const results = await Promise.all(sendPromises);

    const firstErrorResult = results.find(r => !r.ok);

    if (firstErrorResult) {
      const zaloResult = firstErrorResult.data || {};
      return NextResponse.json({
        success: false,
        message: `Zalo Error: ${zaloResult.message || firstErrorResult.error || 'Zalo API request failed'}`,
        errorCode: zaloResult.error ?? -1,
        results
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      totalSent: csUserIds.length,
      results
    }, { status: 200 });

  } catch (error: any) {
    console.error('Zalo Notification API Route Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Internal Server Error'
      },
      { status: 500 }
    );
  }
}
