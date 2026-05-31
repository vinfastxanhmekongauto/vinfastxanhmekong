import { supabase } from './supabase';

/**
 * Uploads an image to Supabase Storage bucket
 * @param file The File object to upload
 * @param folder The target folder (e.g., 'products', 'banners', 'slides')
 * @returns The Public URL of the uploaded image
 */
export const uploadImage = async (file: File, folder: string): Promise<string> => {
    try {
        // 1. Validate file type & size (Example: limit to 5MB max)
        const MAX_SIZE = 5 * 1024 * 1024; // 5MB
        if (!file.type.startsWith('image/')) {
            throw new Error('Định dạng file không hợp lệ. Chỉ chấp nhận hình ảnh.');
        }
        if (file.size > MAX_SIZE) {
            throw new Error('Dung lượng ảnh vượt quá 5MB. Vui lòng nén ảnh trước khi tải lên.');
        }

        // 2. Normalize file name
        // - Lowercase first
        let normalizedName = file.name.toLowerCase();

        // - Remove accents/diacritics (e.g., "hồng ngọc" -> "hong ngoc")
        normalizedName = normalizedName.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

        // - Replace spaces with hyphens
        normalizedName = normalizedName.replace(/\s+/g, '-');

        // - Remove all strictly special characters (retain letters, numbers, hyphens, dots)
        normalizedName = normalizedName.replace(/[^a-z0-9.\-]/g, '');

        // 3. Append Date.now() to make file name unique
        const parts = normalizedName.split('.');
        const ext = parts.pop();
        const baseName = parts.join('.');
        const finalFileName = `${baseName}-${Date.now()}.${ext}`;

        // 4. Construct the file path in Supabase bucket
        const filePath = `${folder}/${finalFileName}`;

        // 5. Upload File to Supabase
        // Make sure the bucket name is exactly 'images'
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('images')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false // Set to false so it NEVER overwrites an existing file
            });

        if (uploadError) {
            console.error('Supabase Upload Error:', uploadError);
            throw new Error(uploadError.message || 'Lỗi khi đưa ảnh lên Supabase.');
        }

        // 6. Return Public URL immediately upon successful upload
        return getPublicUrl(uploadData.path);
    } catch (error: any) {
        console.error('Lỗi khi tải ảnh:', error);
        throw new Error(error.message || 'Upload ảnh thất bại.');
    }
};

/**
 * Gets the full Public URL based on relative path from 'images' bucket
 * @param path The relative path inside 'images' bucket (e.g., 'products/xe-feliz-s-12345.jpg')
 * @returns The full public URL string
 */
export const getPublicUrl = (path: string): string => {
    const { data } = supabase.storage
        .from('images')
        .getPublicUrl(path);

    return data.publicUrl;
};
