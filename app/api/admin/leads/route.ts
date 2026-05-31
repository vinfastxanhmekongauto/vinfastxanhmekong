import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

const VALID_STATUSES = ['Mới', 'Đã liên hệ', 'Đang xử lý', 'Hủy'];

// PATCH /api/admin/leads — Bulk update status
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { ids, status } = body;

        console.log('[Admin API] PATCH payload:', { ids, status });

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: 'Danh sách ID không hợp lệ hoặc rỗng.' }, { status: 400 });
        }

        if (!status || !VALID_STATUSES.includes(status)) {
            return NextResponse.json(
                { error: `Trạng thái không hợp lệ. Chỉ chấp nhận: ${VALID_STATUSES.join(', ')}` },
                { status: 400 }
            );
        }

        // Use supabaseAdmin (service role) to bypass RLS
        const { error } = await supabaseAdmin
            .from('leads')
            .update({ status })
            .in('id', ids);

        if (error) {
            console.error('[Admin API] Supabase PATCH error:', JSON.stringify(error, null, 2));
            return NextResponse.json(
                { error: `Lỗi DB: [${error.code}] ${error.message}` },
                { status: 500 }
            );
        }

        console.log(`[Admin API] Updated ${ids.length} leads → "${status}"`);
        return NextResponse.json({ success: true, updated: ids.length });
    } catch (err: any) {
        console.error('[Admin API] PATCH exception:', err);
        return NextResponse.json({ error: `Server error: ${err?.message}` }, { status: 500 });
    }
}

// DELETE /api/admin/leads — Bulk delete
export async function DELETE(request: NextRequest) {
    try {
        const body = await request.json();
        const { ids } = body;

        console.log('[Admin API] DELETE payload:', { ids });

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: 'Danh sách ID không hợp lệ hoặc rỗng.' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('leads')
            .delete()
            .in('id', ids);

        if (error) {
            console.error('[Admin API] Supabase DELETE error:', JSON.stringify(error, null, 2));
            return NextResponse.json(
                { error: `Lỗi DB: [${error.code}] ${error.message}` },
                { status: 500 }
            );
        }

        console.log(`[Admin API] Deleted ${ids.length} leads`);
        return NextResponse.json({ success: true, deleted: ids.length });
    } catch (err: any) {
        console.error('[Admin API] DELETE exception:', err);
        return NextResponse.json({ error: `Server error: ${err?.message}` }, { status: 500 });
    }
}
