'use server';

import { supabase } from '@/lib/supabase';
import { Resend } from 'resend';
import { FALLBACK_EMAIL } from '@/lib/constants';
import type { AttributionData } from '@/lib/attribution';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface LeadAttributionPayload {
    firstTouch?: AttributionData | null;
    lastTouch?: AttributionData | null;
    sourceUrl?: string;
    notesSummary?: string;
}

export async function submitLead(formData: {
    full_name: string;
    phone: string;
    car_model?: string;
    notes?: string;
    email?: string;
    lead_type?: string;
    appointment_date?: string;
    appointment_time?: string;
    source_url?: string;
    submission_id?: string;
    attribution_notes?: string;
    attribution?: LeadAttributionPayload;
}) {
    try {
        const leadType = formData.lead_type || 'contact';

        // 1. Idempotency Check theo submission_id
        if (formData.submission_id) {
            const { data: existingLead } = await supabase
                .from('leads')
                .select('id')
                .ilike('notes', `%Submission ID: ${formData.submission_id}%`)
                .limit(1)
                .maybeSingle();

            if (existingLead) {
                console.log(`[Idempotency] Lead with submission_id ${formData.submission_id} already exists (${existingLead.id}). Returning without duplicate.`);
                return { success: true, leadId: existingLead.id, isRetry: true };
            }
        }

        // 2. Chuẩn bị UUID và số điện thoại BIGINT
        const leadId = crypto.randomUUID();
        const cleanDigits = (formData.phone || '').replace(/\D/g, '');
        const phoneInt = cleanDigits ? parseInt(cleanDigits, 10) : null;

        // 3. Xây dựng notes metadata (bảo tồn SĐT gốc có số 0, submission_id, và attribution)
        const noteParts: string[] = [];
        if (leadType === 'service_booking') {
            if (formData.notes) noteParts.push(formData.notes);
        } else {
            if (formData.car_model) {
                noteParts.push(`Quan tâm: ${formData.car_model}`);
            }
            if (formData.notes) {
                noteParts.push(`Lời nhắn: ${formData.notes}`);
            }
        }

        noteParts.push(`Raw Phone (SĐT gốc): ${formData.phone}`);
        if (formData.submission_id) {
            noteParts.push(`Submission ID: ${formData.submission_id}`);
        }
        if (formData.attribution?.notesSummary) {
            noteParts.push(formData.attribution.notesSummary);
        } else if (formData.attribution_notes) {
            noteParts.push(formData.attribution_notes);
        }

        const dbNotes = noteParts.join('\n');

        // 4. Insert vào Supabase
        const { error: dbError } = await supabase
            .from('leads')
            .insert([{
                id: leadId,
                full_name: formData.full_name,
                phone: phoneInt,
                email: formData.email || null,
                car_model: formData.car_model || null,
                notes: dbNotes,
                status: 'Mới',
                lead_type: leadType,
                source_url: formData.source_url || formData.attribution?.sourceUrl || null,
                appointment_date: formData.appointment_date || null,
                appointment_time: formData.appointment_time || null,
            }]);

        if (dbError) {
            console.error('Lỗi khi lưu lead vào Supabase:', dbError);
            return { success: false, error: 'Database error' };
        }

        // 5. Gửi email thông báo qua Resend (không chặn luồng nếu email lỗi)
        try {
            const recipientEmail = process.env.ADMIN_EMAIL || FALLBACK_EMAIL;

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

            const cleanNotesHtml = (formData.notes || 'Trống').replace(/\n/g, '<br />');

            await resend.emails.send({
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
        } catch (emailError) {
            console.error("Lỗi gửi mail qua Resend:", emailError);
        }

        return { success: true, leadId, isRetry: false };

    } catch (error) {
        console.error('Unexpected error in submitLead:', error);
        return { success: false, error: 'Unexpected error' };
    }
}
