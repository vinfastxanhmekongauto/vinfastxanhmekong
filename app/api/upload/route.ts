import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'Không nhận được file ảnh.' }, { status: 400 });
        }

        // Validate basic file type
        const isImage = file.type.startsWith('image/');
        const isVideo = file.type === 'video/mp4' || file.type === 'video/webm';

        if (!isImage && !isVideo) {
            return NextResponse.json({ error: 'Định dạng file không hợp lệ. Chỉ chấp nhận hình ảnh hoặc video (mp4, webm).' }, { status: 400 });
        }

        // Tạo tên file chuẩn
        let normalizedName = file.name.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9.\-]/g, '');

        const parts = normalizedName.split('.');
        const ext = parts.pop();
        const baseName = parts.join('.');
        const finalFileName = `${baseName}-${Date.now()}.${ext}`;
        const folder = (formData.get('folder') as string) || 'products';
        const filePath = `${folder}/${finalFileName}`;

        // Upload trực tiếp dùng Supabase Client
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('images')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) {
            console.error('Supabase Upload Error:', uploadError);
            return NextResponse.json({ error: uploadError.message || 'Lỗi từ Supabase khi upload.' }, { status: 500 });
        }

        // Lấy Public URL
        const { data } = supabase.storage.from('images').getPublicUrl(uploadData.path);
        const publicUrl = data.publicUrl;

        // Trả về URL và filename
        return NextResponse.json({ url: publicUrl, filename: finalFileName, message: 'Upload thành công' });

    } catch (error: any) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: error.message || 'Lỗi Server (API) khi xử lý upload.' }, { status: 500 });
    }
}
