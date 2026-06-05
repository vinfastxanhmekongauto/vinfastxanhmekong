'use server';

import { supabase } from '@/lib/supabase';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function submitLead(formData: {
    full_name: string;
    phone: string;
    car_model: string;
    notes: string;
    email?: string;
    lead_type?: string;
    appointment_date?: string;
    appointment_time?: string;
}) {
    try {
        const leadType = formData.lead_type || 'contact';
        const dbNotes = leadType === 'service_booking' 
            ? formData.notes 
            : (formData.car_model ? `Quan tâm: ${formData.car_model} - Lời nhắn: ${formData.notes}` : formData.notes);

        // 1. Insert into Supabase
        const { error: dbError } = await supabase
            .from('leads')
            .insert([{
                full_name: formData.full_name,
                phone: formData.phone,
                email: formData.email || null,
                car_model: formData.car_model || null,
                notes: dbNotes,
                status: 'Mới',
                lead_type: leadType,
                appointment_date: formData.appointment_date || null,
                appointment_time: formData.appointment_time || null
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

            // Determine email subject & heading based on lead_type
            let emailSubject = '📩 [VinFast Xanh Mekong] Có yêu cầu liên hệ mới!';
            let emailHeading = 'Thông báo khách hàng mới';

            switch (leadType) {
                case 'quote':
                    emailSubject = '🎉 [VinFast Xanh Mekong] Có khách hàng mới yêu cầu báo giá!';
                    emailHeading = 'Thông báo yêu cầu báo giá mới';
                    break;
                case 'test_drive':
                    emailSubject = '🚗 [VinFast Xanh Mekong] Có khách hàng đăng ký lái thử!';
                    emailHeading = 'Thông báo đăng ký lái thử mới';
                    break;
                case 'service_booking':
                    emailSubject = '🔧 [VinFast Xanh Mekong] Có khách đăng ký Đặt Lịch Dịch Vụ!';
                    emailHeading = 'Thông báo đặt lịch dịch vụ mới';
                    break;
                default:
                    emailSubject = '📩 [VinFast Xanh Mekong] Có yêu cầu liên hệ mới!';
                    emailHeading = 'Thông báo yêu cầu liên hệ mới';
                    break;
            }

            // Clean format notes with <br /> for HTML emails
            const cleanNotesHtml = formData.notes 
                ? formData.notes.replace(/\n/g, '<br />')
                : 'Trống';

            // Send Email
            const data = await resend.emails.send({
                from: 'VinFast Mekong <onboarding@resend.dev>',
                to: recipientEmail,
                subject: emailSubject,
                html: `
                    <h2>${emailHeading}</h2>
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
                            ${formData.email ? `
                            <tr>
                                <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2;">Email</th>
                                <td style="border: 1px solid #ddd; padding: 8px;">${formData.email}</td>
                            </tr>
                            ` : ''}
                            <tr>
                                <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2;">Dòng xe quan tâm</th>
                                <td style="border: 1px solid #ddd; padding: 8px;">${formData.car_model || 'Trống'}</td>
                            </tr>
                            <tr>
                                <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2;">Lời nhắn / Chi tiết</th>
                                <td style="border: 1px solid #ddd; padding: 8px;">
                                    <div style="white-space: pre-wrap; line-height: 1.6;">${cleanNotesHtml}</div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <br/>
                    <p>Vui lòng đăng nhập hệ thống quản trị để xử lý.</p>
                `
            });
            console.log("Email đã gửi thành công:", data);
        } catch (emailError) {
            console.error("Lỗi gửi mail:", emailError);
        }

        console.log('--- KẾT THÚC SERVER ACTION ---');
        return { success: true };

    } catch (error) {
        console.error('Unexpected error in submitLead:', error);
        console.log('--- KẾT THÚC SERVER ACTION ---');
        return { success: false, error: 'Unexpected error' };
    }
}
