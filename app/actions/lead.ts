'use server';

import { supabase } from '@/lib/supabase';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function submitLead(formData: {
    full_name: string;
    phone: string;
    car_model: string;
    notes: string;
}) {
    try {
        // 1. Insert into Supabase
        const { error: dbError } = await supabase
            .from('leads')
            .insert([{
                full_name: formData.full_name,
                phone: formData.phone,
                car_model: formData.car_model, // Extra fields handled similarly
                notes: formData.car_model ? `Quan tâm: ${formData.car_model} - Lời nhắn: ${formData.notes}` : formData.notes,
                status: 'Mới'
            }]);

        if (dbError) {
            console.error('Lỗi khi lưu lead vào Supabase:', dbError);
            return { success: false, error: 'Database error' };
        }

        // 2. Try to send email with Resend
        try {
            console.log("Đang bắt đầu gửi email...");

            if (!process.env.ADMIN_EMAIL) {
                console.error("ERROR: Environment variable ADMIN_EMAIL is missing! Falling back to default: vinfastxanhmekong@gmail.com");
            }
            const recipientEmail = process.env.ADMIN_EMAIL || 'vinfastxanhmekong@gmail.com';

            // Send Email
            const data = await resend.emails.send({
                from: 'VinFast Mekong <onboarding@resend.dev>',
                to: recipientEmail,
                subject: '🎉 [VinFast Xanh Mekong] Có khách hàng mới yêu cầu báo giá!',
                html: `
                    <h2>Thông báo khách hàng mới</h2>
                    <table style="width: 100%; border-collapse: collapse; text-align: left;">
                        <tbody>
                            <tr>
                                <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2; width: 150px;">Họ tên</th>
                                <td style="border: 1px solid #ddd; padding: 8px;">${formData.full_name}</td>
                            </tr>
                            <tr>
                                <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2;">Số điện thoại</th>
                                <td style="border: 1px solid #ddd; padding: 8px;">${formData.phone}</td>
                            </tr>
                            <tr>
                                <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2;">Dòng xe quan tâm</th>
                                <td style="border: 1px solid #ddd; padding: 8px;">${formData.car_model || 'Trống'}</td>
                            </tr>
                            <tr>
                                <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2;">Lời nhắn</th>
                                <td style="border: 1px solid #ddd; padding: 8px;">${formData.notes || 'Trống'}</td>
                            </tr>
                        </tbody>
                    </table>
                    <br/>
                    <p>Vui lòng đăng nhập hệ thống quản trị để xử lý.</p>
                `
            });
            console.log("Email đã gửi thành công:", data);
        } catch (emailError) {
            // Bắt lỗi gui email để không ảnh hưởng luồng chính
            console.error("Lỗi gửi mail:", emailError);
        }

        console.log('--- KẾT THÚC SERVER ACTION ---');
        // Always return success if DB insert was successful
        return { success: true };

    } catch (error) {
        console.error('Unexpected error in submitLead:', error);
        console.log('--- KẾT THÚC SERVER ACTION ---');
        return { success: false, error: 'Unexpected error' };
    }
}
