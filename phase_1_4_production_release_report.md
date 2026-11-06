# BÁO CÁO PHÁT HÀNH PRODUCTION VÀ ĐO LƯỜNG CHUYỂN ĐỔI (PHASE 1.4)
## DỰ ÁN: VINFAST XANH MEKONG (https://vinfastmekong.vn/)
### PRODUCTION RELEASE & CONVERSION READINESS REPORT

> **Thời điểm thẩm định:** 04/11/2026 (02:35:00+07:00)  
> **Chuyên gia:** Senior QA Architect & Security Release Engineer  
> **Branch:** `main` | **Target Remote:** `origin` (`https://github.com/vinfastxanhmekongauto/vinfastxanhmekong.git`)  
> **Commit sẵn sàng phát hành:** `189acd8` (HEAD) và `fb14d5f` (Tổng cộng 2 commits)  
> **Production Reference:** `https://vinfastmekong.vn/`  
> **Trạng thái phát hành:** **PAUSED AT MANDATORY SECURITY GATE – AWAITING OWNER DIRECTIVE**

---

## 1. TỔNG QUAN PHÁT HÀNH (RELEASE SUMMARY)

Toàn bộ hệ thống đo lường chuyển đổi website (Website Conversion Tracking Phase 1) và bản cập nhật loại bỏ thông báo ngầm Zalo OA (Phase 1.1) đã được đóng gói hoàn chỉnh trong 2 commits Git cục bộ trên nhánh `main`:
1. `fb14d5f`: `feat(analytics): implement GA4 website conversion tracking` (Triển khai đầy đủ 4 primary conversions, 3 secondary interactions, 2 micro-conversions, cơ chế idempotency và first-touch attribution).
2. `189acd8`: `refactor(notifications): remove Zalo OA internal notification integration` (Loại bỏ triệt để cảnh báo lỗi Console `Zalo notification warning: API responded with an error.`).

### Kết quả kiểm soát chất lượng kỹ thuật (Quality Gates):
- **TypeScript Compiler (`npx tsc --noEmit`):** **Exit code 0** (0 lỗi cú pháp hoặc kiểu dữ liệu).
- **Next.js 16 Production Build (`npm run build`):** **Exit code 0** (Biên dịch thành công 33/33 static pages trong 22.9 giây, không có route lỗi).
- **Git Push Dry-run (`git push --dry-run origin main`):** **Exit code 0** (Kết nối và chứng thực GitHub `vinfastxanhmekongauto/vinfastxanhmekong.git` sẵn sàng 100%).

---

## 2. KIỂM TRA TRẠNG THÁI GIT VÀ BẢO TOÀN DỮ LIỆU

### 2.1. Lịch sử Commit sẵn sàng phát hành

```text
189acd8 refactor(notifications): remove Zalo OA internal notification integration (HEAD -> main)
fb14d5f feat(analytics): implement GA4 website conversion tracking
603b744 fix(chatbot): thay icon chatbot (origin/main)
```

Hai commits này hoàn toàn độc lập, sạch sẽ và chỉ chứa các file thuộc phạm vi tracking đã được nghiệm thu qua Phase 1, Phase 1.1 và Phase 1.2.

### 2.2. Bảo toàn các thay đổi ngoài phạm vi trong Working Tree
Các mục sau được bảo toàn nguyên vẹn trong working directory, **tuyệt đối không bị can thiệp, xóa bỏ hay stage**:
1. [`app/(admin)/layout.tsx`](file:///d:/dev/VF-%C3%94%20t%C3%B4/VinfastXanhMekong/app/(admin)/layout.tsx) (Thay đổi của Chủ dự án: Thêm liên kết Sổ tay hướng dẫn).
2. [`components/client/header.tsx`](file:///d:/dev/VF-%C3%94%20t%C3%B4/VinfastXanhMekong/components/client/header.tsx) (Thay đổi của Chủ dự án: Gỡ bỏ logo phụ Xanh Mekong).
3. `app/(admin)/admin/huong-dan/` (Tính năng Sổ tay hướng dẫn Admin).
4. `app/(client)/dich-vu/huong-dan-su-dung/` (Tính năng Sổ tay hướng dẫn Client).
5. `components/TiptapEditor.tsx` (Trình soạn thảo WYSIWYG).
6. Thư mục `audit-evidence/` và các báo cáo Markdown thẩm định.

### 2.3. Kiểm tra bảo mật Secret & Environment
- File `.env.local` được bảo vệ nghiêm ngặt trong `.gitignore`, không nằm trong commit.
- Không có bất kỳ token, API key (Resend, Supabase anon, Google) hay private key nào bị commit vào kho mã nguồn Git.

---

## 3. ĐIỀU KIỆN BẢO MẬT BẮT BUỘC VÀ BÁO CÁO BLOCKER (DEF-01)

Theo đúng điều khoản chỉ đạo tại Mục 2.B của Lệnh thực thi:
> *"Không phát hành phiên bản để anon key có thể SELECT/UPDATE/DELETE dữ liệu Lead.*  
> *Không bật RLS trước khi xác minh Admin Dashboard vẫn đọc được Lead.*  
> *Nếu không thể xử lý an toàn trong phạm vi phát hành hiện tại, DỪNG phát hành và báo cáo rõ blocker."*

### 3.1. Chi tiết Blocker kỹ thuật phát hiện được:
1. **Trạng thái Supabase Production hiện tại:**
   Bảng `public.leads` đang có Row Level Security (RLS) ở trạng thái **DISABLED** (`relrowsecurity = false`). Quyền schema PostgreSQL cho phép `anon key` công khai thực hiện `SELECT`, `UPDATE` và `DELETE`.
2. **Thiếu biến `SUPABASE_SERVICE_ROLE_KEY`:**
   Trong môi trường hiện tại (`.env.local` và phía host), biến `SUPABASE_SERVICE_ROLE_KEY` **hoàn toàn chưa được cấu hình**. File [`lib/supabase-admin.ts`](file:///d:/dev/VF-%C3%94%20t%C3%B4/VinfastXanhMekong/lib/supabase-admin.ts) đang phải fallback sử dụng `anonKey`.
3. **Sự phụ thuộc của Admin Dashboard:**
   Trang [`app/(admin)/admin/dashboard/page.tsx`](file:///d:/dev/VF-%C3%94%20t%C3%B4/VinfastXanhMekong/app/(admin)/admin/dashboard/page.tsx) là Client Component, hiện đang đọc danh sách lead trực tiếp từ trình duyệt bằng `anon key`.

### 3.2. Hậu quả nếu bật RLS ngay lúc này:
- Nếu thực hiện lệnh `ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;` và thu hồi quyền `SELECT` của `anon`:
  - Vì chưa có `SUPABASE_SERVICE_ROLE_KEY`, cả trình duyệt lẫn server đều chỉ có `anon key`.
  - **Hậu quả:** Toàn bộ Admin Dashboard (`/admin/dashboard`) sẽ ngay lập tức bị lỗi hoặc trắng bảng (hiển thị 0 khách hàng).
- Nếu không bật RLS:
  - Bản phát hành sẽ chưa đóng được lỗ hổng bảo mật DEF-01 đối với anon key.

> **QUYẾT ĐỊNH CỦA QA ARCHITECT:**  
> Tuân thủ nghiêm ngặt chỉ đạo an toàn, Agent **TẠM DỪNG THAO TÁC PUSH LÊN PRODUCTION** tại cổng kiểm soát này để báo cáo rõ ràng Blocker cho Chủ dự án đưa ra quyết định chỉ đạo tiếp theo.

---

## 4. TÌNH TRẠNG SẴN SÀNG ĐO LƯỜNG CHUYỂN ĐỔI (CONVERSION READINESS)

Hạ tầng đo lường chuyển đổi đã được thẩm định thực nghiệm 100% đạt chuẩn theo mục tiêu kinh doanh cốt lõi:

### 4.1. Sự kiện chuyển đổi Lead chính (Primary Conversions)
- `generate_lead_quote`: Báo giá xe (Trang chủ, Modal Báo giá, Trang khuyến mãi).
- `generate_lead_test_drive`: Đăng ký lái thử (Modal Lái thử).
- `generate_lead_service`: Đặt lịch dịch vụ bảo dưỡng / sửa chữa.
- `generate_lead_contact`: Gửi yêu cầu từ trang liên hệ.

### 4.2. Nguyên tắc đảm bảo tính chính xác cho Google Ads
1. **Chỉ kích hoạt khi Backend thành công:** Sự kiện chuyển đổi chỉ được phát sau khi Server Action `submitLead` ghi nhận thành công vào Supabase (`result.success === true`).
2. **Không phát sinh chuyển đổi giả khi validation lỗi:** Khi người dùng nhập sai số điện thoại hoặc để trống trường bắt buộc, form bị chặn ở client, không có request Server Action, không có sự kiện GA4 conversion.
3. **Chống trùng lặp tuyệt đối (Anti-Duplicate / Idempotency):** Mỗi lượt submit mang một `submission_id` UUID riêng. Nếu người dùng bấm liên tiếp, hệ thống trả về `isRetry: true` và **chặn không gửi lại conversion event**, triệt tiêu nguy cơ Google Ads đếm một khách hàng nhiều lần.
4. **Gắn kèm ID định danh:** Mọi sự kiện chuyển đổi gửi lên GA4 đều chứa tham số `lead_id` khớp chính xác với UUID bản ghi trong database Supabase, phục vụ việc đối soát doanh thu thực tế.
5. **Phân tách rạch ròi hành trình:**
   - Xem/Mở form: `view_quote_form`, `view_test_drive_form` (Micro-conversion).
   - Tương tác nhanh: `click_phone`, `click_zalo`, `click_messenger` (Secondary interaction).
   - Gửi form thành công: `generate_lead_*` (Primary conversion duy nhất).

---

## 5. HƯỚNG DẪN CẤU HÌNH GOOGLE ADS (DÀNH CHO CHỦ DỰ ÁN)

Để Google Ads nhận đúng chuyển đổi Lead từ GA4 và tối ưu ngân sách 15.000.000 VNĐ/tháng:

1. **Bước 1:** Đăng nhập Google Ads > Menu **Mục tiêu (Goals)** > **Lượt chuyển đổi (Conversions)** > **Bản tóm tắt (Summary)**.
2. **Bước 2 (Quan trọng):** Tìm hành động chuyển đổi cũ `ads_conversion_Gi_i_thi_u_v_ch_ng_t_i_1` (Xem trang Giới thiệu) và đổi từ **Chính (Primary)** sang **Phụ (Secondary)** để tránh thuật toán tối ưu sai mục tiêu.
3. **Bước 3:** Nhấp **Hành động chuyển đổi mới (New Conversion Action)** > Chọn **Nhập (Import)** > Chọn **Thuộc tính Google Analytics 4 (Web)**.
4. **Bước 4:** Tích chọn 4 sự kiện Lead:
   - `generate_lead_quote` (Đặt làm Primary)
   - `generate_lead_test_drive` (Đặt làm Primary)
   - `generate_lead_service` (Đặt làm Primary)
   - `generate_lead_contact` (Đặt làm Primary)
5. **Lưu ý chu kỳ xử lý:** Sau khi gửi lead, GA4 Realtime ghi nhận ngay lập tức; Google Ads có thể mất từ 6 - 24 giờ để đồng bộ dữ liệu vào bảng báo cáo chiến dịch.

---

## 6. HAI HƯỚNG XỬ LÝ ĐỂ CHỦ DỰ ÁN QUYẾT ĐỊNH

### HƯỚNG 1 (ƯU TIÊN BẢO MẬT TRIỆT ĐỂ TRƯỚC KHI PUSH):
- **Thao tác của Chủ dự án:** Truy cập Supabase Dashboard (Project Settings > API > copy `service_role secret`) và bổ sung `SUPABASE_SERVICE_ROLE_KEY` vào file `.env.local` và Vercel Environment Variables.
- **Thao tác của Agent:** Chuyển Admin Dashboard sang Server Action an toàn -> Chạy lệnh SQL kích hoạt RLS khóa hoàn toàn quyền của `anon` -> Chạy kiểm thử xác nhận Admin vẫn đọc được Lead -> Thực hiện `git push` và deploy Production.

### HƯỚNG 2 (ƯU TIÊN PHÁT HÀNH NGAY ĐỂ TEST GOOGLE ADS CONVERSION):
- Chủ dự án chấp nhận giữ nguyên trạng thái Supabase hiện hữu của Production (như website hiện tại đang chạy).
- Agent thực hiện ngay lệnh `git push origin main` để Vercel CI/CD tự động deploy 2 commits `fb14d5f` và `189acd8`.
- Website Production cập nhật ngay tính năng tracking GA4 chuẩn hóa và loại bỏ lỗi Zalo console.
- Hạng mục siết RLS bảo mật sẽ được thực hiện riêng tại Phase 1.5.

---

## 7. KẾT LUẬN

> ### **FINAL STATUS: PAUSED AT MANDATORY SECURITY GATE – AWAITING OWNER DIRECTIVE**  
> *(Toàn bộ mã nguồn, TypeScript và Production Build đã sẵn sàng 100%. Lệnh `git push` đã được kiểm tra dry-run thành công. Hệ thống đang tạm dừng trước cổng bảo mật DEF-01 để chờ quyết định lựa chọn Hướng 1 hay Hướng 2 từ Chủ dự án).*

