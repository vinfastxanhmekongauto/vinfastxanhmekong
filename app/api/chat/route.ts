import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_MESSAGE_LENGTH = 4000;
const N8N_TIMEOUT_MS = 60_000;

export async function POST(request: NextRequest) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), N8N_TIMEOUT_MS);

  try {
    const body = await request.json();
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const sessionId =
      typeof body.sessionId === "string" && body.sessionId.trim()
        ? body.sessionId.trim()
        : crypto.randomUUID();

    if (!message || message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { success: false, error: "Tin nhắn không hợp lệ." },
        { status: 400 },
      );
    }

    const webhookUrl = process.env.N8N_WEBHOOK_URL;

    if (!webhookUrl) {
      return NextResponse.json(
        { success: false, error: "Dịch vụ chưa được cấu hình." },
        { status: 500 },
      );
    }

    const payload = {
      function: "message-sent",
      key: "",
      data: {
        user_id: `web-${sessionId}`,
        message_id: crypto.randomUUID(),
        message,
        attachments: [],
        conversation_user_id: sessionId,
        conversation_id: sessionId,
        conversation_status_code: 2,
        conversation_source: "vinfastmekong.vn",
        sender_url: "https://www.vinfastmekong.vn",
      },
    };

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      "Origin": "https://www.vinfastmekong.vn",
      "Referer": "https://www.vinfastmekong.vn/",
    };

    if (process.env.N8N_WEBHOOK_SECRET) {
      headers["X-Webhook-Secret"] = process.env.N8N_WEBHOOK_SECRET;
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: controller.signal,
    });

    const raw = await response.text();
    console.log("=== TRẠNG THÁI HTTP ===", response.status);
    console.log("=== DỮ LIỆU N8N TRẢ VỀ ===", raw);
    let result: unknown;

    try {
      result = JSON.parse(raw);
    } catch {
      result = {
        success: false,
        error: "Phản hồi từ trợ lý không hợp lệ.",
      };
    }

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: "Trợ lý đang tạm thời gián đoạn." },
        { status: 502 },
      );
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "AbortError";

    return NextResponse.json(
      {
        success: false,
        error: timedOut
          ? "Trợ lý phản hồi quá thời gian."
          : "Không thể kết nối trợ lý.",
      },
      { status: timedOut ? 504 : 500 },
    );
  } finally {
    clearTimeout(timeout);
  }
}
