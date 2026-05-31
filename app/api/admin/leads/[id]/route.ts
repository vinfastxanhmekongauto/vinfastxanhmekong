import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// PATCH /api/admin/leads/[id] — Update a single lead
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { full_name, phone, car_model, notes, status } = body;

        console.log(`[Admin API] PATCH single lead id=${id}`, { full_name, phone, car_model, notes, status });

        if (!id) {
            return NextResponse.json({ error: 'ID lead không hợp lệ.' }, { status: 400 });
        }

        // Build update object — only include fields that are provided
        const updateData: Record<string, any> = {};
        if (full_name !== undefined) updateData.full_name = full_name?.trim() || null;
        if (phone !== undefined) updateData.phone = phone?.trim() || null;
        if (car_model !== undefined) updateData.car_model = car_model?.trim() || null;
        if (notes !== undefined) updateData.notes = notes?.trim() || null;
        if (status !== undefined) updateData.status = status;

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: 'Không có dữ liệu nào để cập nhật.' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('leads')
            .update(updateData)
            .eq('id', id);

        if (error) {
            console.error('[Admin API] Single PATCH error:', JSON.stringify(error, null, 2));
            return NextResponse.json(
                { error: `Lỗi DB: [${error.code}] ${error.message}` },
                { status: 500 }
            );
        }

        console.log(`[Admin API] Lead ${id} updated successfully.`);
        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('[Admin API] PATCH [id] exception:', err);
        return NextResponse.json({ error: `Server error: ${err?.message}` }, { status: 500 });
    }
}
