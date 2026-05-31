import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { verifyToken } from '@/lib/auth-utils';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

export async function PATCH(request: Request) {
    try {
        const supabase = await createClient();

        // 1. Supabase Native Auth
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        // 2. Custom JWT Fallback (since admin_session is used by the layout)
        const cookieStore = await cookies();
        const token = cookieStore.get('admin_session')?.value;
        const valid = await verifyToken(token);

        if ((authError || !user) && !valid) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const username = user?.email || valid?.username;

        if (!username) {
            return NextResponse.json({ error: 'Unauthorized user.' }, { status: 401 });
        }

        const body = await request.json();
        const { currentPassword, newPassword } = body;

        // Fetch user from custom user_admin table
        const { data: adminRecord, error: fetchError } = await supabase
            .from('user_admin')
            .select('*')
            .eq('username', username)
            .single();

        if (fetchError || !adminRecord) {
            return NextResponse.json({ error: 'Tài khoản quản trị không tồn tại.' }, { status: 404 });
        }

        // Verify current password against either hashed format or plaintext fallback
        let isMatch = false;

        // Step A: Attempt to compare using bcrypt
        isMatch = await bcrypt.compare(currentPassword, adminRecord.password);

        // Step B (Fallback): If hashed comparison fails, check if the raw strings match directly
        if (!isMatch) {
            isMatch = currentPassword === adminRecord.password;
        }

        if (!isMatch) {
            return NextResponse.json({ error: 'Mật khẩu hiện tại không đúng.' }, { status: 400 });
        }

        // Generate bcrypt hash for the new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        // Update database
        const { error: updateError } = await supabase
            .from('user_admin')
            .update({ password: hashedNewPassword })
            .eq('username', username);

        if (updateError) {
            console.error('Error updating password:', updateError);
            return NextResponse.json({ error: 'Không thể cập nhật mật khẩu.' }, { status: 500 });
        }

        return NextResponse.json({ message: 'Cập nhật mật khẩu thành công.' });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Lỗi máy chủ nội bộ.' }, { status: 500 });
    }
}
