# BÁO CÁO KIỂM TRA LẦN CUỐI: PRODUCTION CUT-OVER READINESS CHECK
## WEBSITE VINFAST XANH MEKONG (`vinfastmekong.vn`) TRÊN PRODUCTION VPS

- **Dự án:** Website VinFast Xanh Mekong
- **Repository:** `D:/dev/VF-ô tô/VinfastXanhMekong`
- **Thời điểm kiểm tra:** 06/11/2026 17:00 (UTC+7)
- **Mục tiêu:** Kiểm tra lần cuối website `vinfastmekong.vn` trước khi chuyển traffic Production từ Netlify sang VPS.
- **Nguyên tắc tuân thủ:** READ-ONLY AUDIT. Không commit/push, không sửa code, không đổi DNS, không cấp SSL, không can thiệp BOS.
- **KẾT LUẬN CUỐI CÙNG (FINAL VERDICT):** **`READY FOR DNS CUT-OVER`**

---

### 1. KIỂM TRA SOURCE & DOCKER (SOURCE / DOCKER AUDIT)

| Tiêu chí | Trạng thái | Chi tiết xác minh |
| :--- | :---: | :--- |
| **Next.js Standalone Output** | **ĐẠT** | `output: 'standalone'` kích hoạt trong `next.config.ts`, tạo bundle tối giản `server.js` |
| **Non-root Container Execution** | **ĐẠT** | Dockerfile tạo và chạy dưới quyền `USER nextjs` (uid 1001, gid 1001) |
| **Bảo mật Secret (Zero Hardcoded Secrets)** | **ĐẠT** | Không chứa API key, private key hay password trong mã nguồn/image. Biến môi trường inject qua `.env` quyền `600` trên VPS |
| **Supabase Cloud Độc lập** | **ĐẠT** | Kết nối trực tiếp tới Supabase riêng (`https://csuojiptwnfjnvfmwzhy.supabase.co`) |
| **Không kết nối BOS PostgreSQL** | **ĐẠT** | Hoàn toàn không có chuỗi kết nối, driver hay port mapping tới `bos_db` (Port 5432) |
| **Bảo toàn cơ chế tích hợp BOS CRM** | **ĐẠT** | Sử dụng REST API bảo mật qua HTTPS `https://gateway.vinfastmekong.vn` ở chế độ background execution (`after()`), không dùng mạng nội bộ container |

---

### 2. XÁC MINH TÀI NGUYÊN VPS (VPS RESOURCE VERIFICATION)

Thông số phần cứng VPS Production: **2 CPU Cores / 4 GB RAM / 40 GB NVMe Disk**

- **Dung lượng RAM hệ thống (`free -h`):**
  - Tổng RAM: **3.8 GiB**
  - RAM đang dùng: **931 MiB** (~24%)
  - RAM khả dụng (Available): **2.9 GiB** (>75% bộ nhớ còn trống)
  - Swap: 2.0 GiB (chỉ sử dụng 127 MiB)
- **Dung lượng Ổ cứng (`df -h`):**
  - Partition `/dev/sda2`: Tổng 40 GB, đã dùng **12 GB** (30%), còn trống **29 GB**.
- **Cấu hình giới hạn tài nguyên container (`docker inspect vinfastmekong-web`):**
  - `MemoryLimit`: **1,073,741,824 bytes (1 GiB)**
  - `MemoryReservation`: **268,435,456 bytes (256 MiB)**
  - `NanoCpus`: **2,000,000,000 (2.0 vCPUs)**
  - `RestartPolicy`: `unless-stopped`
  - `State.OOMKilled`: `false`
- **Tiêu thụ tài nguyên thực tế (`docker stats --no-stream`):**
  - Container `vinfastmekong-web`: **84.64 MiB / 1 GiB (8.27% hạn mức)**.
  - CPU thực tế: **0.00%** (Idle).
  - Đánh giá mức độ phù hợp: Hạn mức 1 GiB RAM là **cực kỳ tối ưu và an toàn**; Next.js Standalone hoạt động ổn định ở ~85 MiB, hạn mức 1 GiB cho phép đệm gấp 12 lần lưu lượng đồng thời mà vẫn bảo vệ tuyệt đối 3 GiB RAM còn lại cho hệ điều hành và hệ thống BOS.

---

### 3. TÌNH TRẠNG CONTAINER DOCKER (DOCKER HEALTH CHECK)

- **Trạng thái Compose (`docker compose -f docker-compose.production.yml ps`):**
  ```text
  NAME                IMAGE                      COMMAND                  SERVICE   STATUS                    PORTS
  vinfastmekong-web   vinfastmekong-web:latest   "docker-entrypoint.s…"   web       Up 25 minutes (healthy)   127.0.0.1:3000->3000/tcp
  ```
- **Kiểm tra Health Endpoint (`curl http://127.0.0.1:3000/api/health`):**
  - Mã phản hồi: **`HTTP/1.1 200 OK`**
  - Nội dung: `{"status":"ok","service":"vinfastmekong-web","timestamp":"2026-11-06T09:58:42.903Z"}`
- **Nhật ký Container (`docker logs --tail 200 vinfastmekong-web`):**
  - Khởi động thành công trong **157ms**:
    ```text
    ▲ Next.js 16.1.6
    - Local:         http://localhost:3000
    - Network:       http://0.0.0.0:3000
    ✓ Starting...
    ✓ Ready in 157ms
    ```
  - **Không có** crash loop.
  - **Không có** unhandled exception.
  - **Không có** database connection error.
  - **Không có** Supabase auth/config error.
  - **Không có** missing environment variable.
  - **Không có** Next.js runtime error.

---

### 4. CẤU HÌNH NGINX REVERSE PROXY

- **Kiểm tra cú pháp (`nginx -t`):**
  ```text
  nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
  nginx: configuration file /etc/nginx/nginx.conf test is successful
  ```
- **Trạng thái dịch vụ (`systemctl status nginx`):** `active (running)`.
- **Cấu hình Virtual Host Website (`/etc/nginx/sites-enabled/vinfastmekong.vn`):**
  - Server names: `vinfastmekong.vn www.vinfastmekong.vn`
  - Reverse proxy đúng về: **`http://127.0.0.1:3000`**
  - Hỗ trợ Let's Encrypt validation: Có location `/.well-known/acme-challenge/` trỏ về `/var/www/html`.
  - Hỗ trợ WebSocket và HTTP/1.1: Đã bật (`Upgrade`, `Connection "upgrade"`).
  - Hỗ trợ Streaming SSR: `proxy_buffering off`.
- **Bảo toàn BOS Gateway (`/etc/nginx/sites-enabled/bos-gateway`):**
  - Server name: `gateway.vinfastmekong.vn` trỏ về `127.0.0.1:3001` (BOS Backend).
  - Chứng chỉ SSL Let's Encrypt của BOS: **Nguyên vẹn 100%, hoạt động bình thường**.

---

### 5. XÁC MINH CÁCH LY HỆ THỐNG BOS (BOS ISOLATION VERIFICATION)

| Mục kiểm tra | Kết quả | Chi tiết |
| :--- | :---: | :--- |
| **Mạng Docker (Network)** | **CÁCH LY 100%** | Container `vinfastmekong-web` chỉ tham gia mạng `vinfastmekongvn_vinfastmekong_net` (Subnet `172.18.0.0/16`). **Tuyệt đối không** tham gia `bos_backend_bos_internal_net` (Subnet `172.20.0.0/24`) |
| **Cổng công cộng (Port Binding)** | **AN TOÀN** | Lệnh `ss -tulpn` xác nhận port 3000 chỉ bind duy nhất trên loopback `127.0.0.1:3000`. **Không** expose port 3000 public ra `0.0.0.0` |
| **BOS Backend Container** | **HOẠT ĐỘNG BÌNH THƯỜNG** | Container `bos_backend-backend-1` giữ trạng thái `Up (healthy)`, RAM 86.9 MiB, Port `127.0.0.1:3001` |
| **BOS PostgreSQL Container** | **HOẠT ĐỘNG BÌNH THƯỜNG** | Container `bos_backend-postgres-1` giữ trạng thái `Up (healthy)`, RAM 30.2 MiB, Port `127.0.0.1:5432` |
| **BOS API Healthcheck** | **HTTP 200 OK** | `curl http://127.0.0.1:3001/health` trả về `{"status":"ok","uptimeSeconds":3534,"version":"1.0.0"}` |
| **BOS Domain** | **KHÔNG BỊ ẢNH HƯỞNG** | `gateway.vinfastmekong.vn` giữ nguyên cấu hình, không bị xáo trộn |

---

### 6. ĐỐI CHIẾU BIẾN MÔI TRƯỜNG (ENVIRONMENT AUDIT)

Đối chiếu đầy đủ giữa `.env.example`, `docker-compose.production.yml` và runtime container:
- `NEXT_PUBLIC_SUPABASE_URL`: Đã nạp chính xác vào container & client bundle.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Đã nạp chính xác vào container & client bundle.
- `NEXT_PUBLIC_GA_ID`: Đã nạp chính xác (`G-X8LZPZ2L00`).
- `NEXT_PUBLIC_BASE_URL`: Đã nạp chính xác (`https://vinfastmekong.vn`).
- `NEXT_PUBLIC_SITE_URL`: Đã nạp chính xác.
- `ADMIN_EMAIL`: Đã nạp danh sách multi-recipient.
- `RESEND_API_KEY`: Đã nạp.
- `BOS_API_URL`, `BOS_USERNAME`, `BOS_PASSWORD`: Đã nạp phục vụ đồng bộ thứ cấp background.
- **Bảo mật:** Không có bất kỳ giá trị secret nào bị ghi nhận công khai.

---

### 7. HIỆN TRẠNG LƯU LƯỢNG PRODUCTION (PRODUCTION TRAFFIC READINESS)

- **Kiểm tra DNS thực tế (`Resolve-DnsName`):**
  - `vinfastmekong.vn` (Record A): Đang trỏ về **`75.2.60.5`** (**Netlify**)
  - `www.vinfastmekong.vn` (Record CNAME): Đang trỏ về **`vinfastxanhmekong.netlify.app`** (**Netlify**)
- **Kiểm tra phản hồi thực tế (`curl -I https://www.vinfastmekong.vn`):**
  - Server: `Netlify`
  - HTTP Status: `200 OK`
- **Xác nhận:** Lưu lượng người dùng thực tế hiện tại **100% vẫn đang được phục vụ bởi Netlify**. VPS `103.72.97.120` chưa nhận lưu lượng công cộng, hoàn toàn sẵn sàng tiếp quản ngay khi trỏ DNS.

---

### 8. KẾT LUẬN & QUY TRÌNH THỰC HIỆN TIẾP THEO

### KẾT LUẬN: **`READY FOR DNS CUT-OVER`**

Hệ thống đã đạt đầy đủ 100% các tiêu chí kỹ thuật, tài nguyên và an toàn cách ly để thực hiện chuyển giao lưu lượng Production sang VPS.

#### CÁC BƯỚC TIẾP THEO CẦN THỰC HIỆN (KHI CHỦ DỰ ÁN RA LỆNH):

> [!IMPORTANT]
> Toàn bộ các bước dưới đây CHƯA ĐƯỢC THỰC HIỆN trong phase này và chỉ tiến hành khi có phê duyệt chính thức từ Chủ dự án:

1. **Cập nhật DNS A record:** Trỏ `vinfastmekong.vn` về IP VPS: **`103.72.97.120`** (giảm TTL xuống 300s để chuyển đổi nhanh).
2. **Cập nhật DNS www record:** Trỏ `www.vinfastmekong.vn` (Record A hoặc CNAME) về IP VPS: **`103.72.97.120`**.
3. **Cấp phát SSL Let's Encrypt:** Khi DNS đã nhận IP VPS, thực thi lệnh trên VPS:
   ```bash
   certbot --nginx -d vinfastmekong.vn -d www.vinfastmekong.vn
   ```
4. **Xác minh HTTPS:** Truy cập `https://vinfastmekong.vn` và `https://www.vinfastmekong.vn` để đảm bảo chứng chỉ SSL hợp lệ (Let's Encrypt Authority).
5. **Xác minh Redirect HTTP → HTTPS:** Kiểm tra truy cập `http://vinfastmekong.vn` tự động chuyển hướng mã 301 sang `https://www.vinfastmekong.vn`.
6. **Kiểm tra Healthcheck & Chức năng cuối cùng:** Kiểm tra trang chủ, form nhận báo giá, đặt lịch lái thử, gửi dữ liệu sang Supabase và đồng bộ BOS CRM.
7. **Kiểm tra quy trình Rollback dự phòng:** Đảm bảo khả năng quay lại Netlify tức thì bằng cách đổi lại DNS về `75.2.60.5` trong trường hợp phát sinh sự cố ngoài ý muốn.

