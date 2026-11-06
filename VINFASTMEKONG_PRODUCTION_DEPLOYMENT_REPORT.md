# BÁO CÁO TOÀN DIỆN: SOURCE AUDIT, DOCKERIZATION & VPS DEPLOYMENT
## WEBSITE VINFAST XANH MEKONG (`vinfastmekong.vn`) TRÊN PRODUCTION VPS

- **Dự án:** Website VinFast Xanh Mekong
- **Môi trường triển khai:** Production VPS (`103.72.97.120:24700`)
- **Kiến trúc:** Docker Engine + Docker Compose (Độc lập 100% với BOS Backend)
- **Ngày thực hiện:** 06/11/2026
- **Trạng thái cuối cùng:** **`READY WITH CONDITIONS`** (Container đã chạy Healthy trên VPS; Điều kiện kích hoạt: Chuyển DNS A record sang VPS và cấp chứng chỉ SSL)

---

### 1. SOURCE ARCHITECTURE
- Cấu trúc ứng dụng: Next.js 16 App Router (`app/` directory).
- Phân vùng chức năng:
  - Client portal: Giao diện người dùng công cộng (`app/(client)/`), trang chủ, dòng xe điện, bảng giá, lái thử, dịch vụ, khuyến mãi, tin tức, tuyển dụng.
  - Admin dashboard: Giao diện quản trị viên (`app/(admin)/admin/`), quản lý leads, bài viết, xe, tuyển dụng, cài đặt.
  - Server actions & APIs: Xử lý tiếp nhận lead, upload tài nguyên, xác thực tài khoản, đồng bộ CRM.

### 2. FRAMEWORK & RUNTIME
- **Framework:** Next.js `16.1.6` (Turbopack engine).
- **UI Library:** React `19.2.3` & React DOM `19.2.3`.
- **Runtime:** Node.js `20-alpine` (LTS) trên nền tảng Linux Alpine.
- **Styling:** Tailwind CSS v4 (`@tailwindcss/postcss`).
- **Build Mode:** Standalone output (`output: 'standalone'` trong `next.config.ts`), tách riêng server runtime tối giản với footprint siêu nhẹ.

### 3. DEPENDENCIES
- Quản lý gói: `npm` với `package-lock.json` (Lockfile v3).
- Các thư viện chính:
  - `@supabase/ssr` (`^0.9.0`) & `@supabase/supabase-js` (`^2.97.0`): Kết nối Supabase.
  - `resend` (`^6.9.3`): Gửi email thông báo lead cho quản trị viên.
  - `jose` (`^6.2.0`) & `bcryptjs` (`^3.0.3`): Xác thực JWT phiên làm việc admin.
  - `framer-motion` (`^12.35.0`) & `lucide-react` (`^0.575.0`): Hoạt ảnh và biểu tượng giao diện.
  - `@tiptap/*`: Trình soạn thảo nội dung phong phú cho admin.
  - `@upstash/ratelimit` & `@upstash/redis`: Giới hạn tốc độ truy cập.

### 4. SUPABASE ARCHITECTURE (ISOLATION MANDATE)
- **Cơ chế lưu trữ:** Website sử dụng **Supabase độc lập** (`https://csuojiptwnfjnvfmwzhy.supabase.co`).
- **Phân tách hoàn toàn khỏi BOS:**
  - Website **KHÔNG** kết nối tới PostgreSQL của BOS (`bos_db` trên port 5432).
  - Website **KHÔNG** sử dụng Redis hay BullMQ của BOS.
  - Website **KHÔNG** tạo thêm container PostgreSQL cục bộ nào (chỉ sử dụng Supabase Cloud).
- **Storage:** Supabase Storage bucket `images` phục vụ toàn bộ media tải lên từ admin/khách hàng.

### 5. DOCKER ARCHITECTURE
Áp dụng mô hình **Multi-Stage Build** 3 tầng chuẩn Production:
- **Stage 1 (`deps`):** Cài đặt dependencies sạch thông qua `npm ci` trên nền `node:20-alpine` với `libc6-compat`.
- **Stage 2 (`builder`):** Biên dịch mã nguồn với Next.js Turbopack:
  - Nhúng các biến công khai `NEXT_PUBLIC_*` vào client bundle.
  - Cấu hình kiểm soát bộ nhớ: `NEXT_CPU_NUM=2`, `NODE_OPTIONS="--max-old-space-size=2560"` nhằm chống tràn RAM (OOM) trên VPS.
  - Tạo gói output `standalone` và static assets.
- **Stage 3 (`runner`):** Container runtime siêu nhẹ:
  - Người dùng không đặc quyền: `USER nextjs` (uid 1001, gid 1001) bảo đảm an toàn hệ điều hành.
  - Cài đặt `curl` phục vụ Docker native healthcheck.
  - Dung lượng image: **94.7 MB** (so với 1.5 GB của image thông thường).

### 6. FILES CREATED / MODIFIED
| Tập tin | Hành động | Mục đích |
| :--- | :---: | :--- |
| `Dockerfile` | Tạo mới | Multi-stage build, Alpine runtime, non-root user, Next.js standalone |
| `.dockerignore` | Tạo mới | Loại bỏ `.git`, `.env*`, `node_modules`, `.next`, cache |
| `docker-compose.yml` | Tạo mới | Định nghĩa service website, port, network, limits, healthcheck |
| `docker-compose.production.yml` | Tạo mới | Cấu hình production dự phòng tương đương |
| `.env.example` | Cập nhật | Template chứa 100% placeholder, zero secrets |
| `app/api/health/route.ts` | Tạo mới | Health endpoint trả về `{"status":"ok","service":"vinfastmekong-web"}` |
| `deployment/nginx-vinfastmekong.vn.conf` | Tạo mới | Cấu hình Nginx reverse proxy cho website |
| `next.config.ts` | Chỉnh sửa | Kích hoạt `output: 'standalone'` |
| `.gitignore` | Chỉnh sửa | Cho phép track `.env.example` (`!.env.example`) |

### 7. DOCKER IMAGE
- **Image Name:** `vinfastmekong-web:latest`
- **ID:** `db0ebca5d558`
- **Content Size:** **94.7 MB**
- **Disk Usage:** 362 MB (bao gồm layers build cache)

### 8. CONTAINER NAME
- **Container Name:** `vinfastmekong-web`
- **Restart Policy:** `unless-stopped`

### 9. PORT BINDING
- **Nội bộ container:** Port `3000`
- **Ánh xạ máy chủ (Host Binding):** `127.0.0.1:3000:3000`
- **Nguyên tắc bảo mật:** Chỉ lắng nghe trên Loopback `127.0.0.1`, tuyệt đối **KHÔNG** mở trực tiếp port 3000 ra Internet (`0.0.0.0`). Mọi truy cập phải đi qua Nginx Reverse Proxy.
- **Xác minh cổng:** Port 3000 hoàn toàn tách biệt khỏi port 3001 của BOS Backend và 5432 của BOS PostgreSQL.

### 10. NETWORK ISOLATION
- **Docker Network:** `vinfastmekong_net` (Bridge driver).
- **Cách ly tuyệt đối:** Không liên kết với `bos_backend_bos_internal_net` của BOS.

### 11. ENVIRONMENT VARIABLES MANAGEMENT
- Toàn bộ secret được inject qua file `.env` (quyền `chmod 600`) đặt tại `/opt/vinfastmekong.vn/.env` trên VPS.
- Tuyệt đối không nướng (bake) secret vào Docker image.
- `.env.example` trong repository chỉ chứa tên biến và placeholder mẫu.

### 12. REVERSE PROXY CONFIGURATION
- **Phần mềm:** Nginx 1.24 (Systemd service trên Ubuntu host).
- **File cấu hình:** `/etc/nginx/sites-available/vinfastmekong.vn` (symlinked tại `/etc/nginx/sites-enabled/vinfastmekong.vn`).
- **Chức năng:**
  - Lắng nghe port 80 cho `vinfastmekong.vn` và `www.vinfastmekong.vn`.
  - Hỗ trợ Let's Encrypt validation qua `/.well-known/acme-challenge/`.
  - Proxy toàn bộ HTTP request tới `http://127.0.0.1:3000`.
  - Bật WebSocket upgrade và HTTP/1.1 cho Next.js.
  - Tắt proxy buffering phục vụ streaming SSR.
- **Tình trạng kiểm tra:** `nginx -t` thành công, `systemctl reload nginx` thành công, không làm gián đoạn virtual host `gateway.vinfastmekong.vn` của BOS.

### 13. SSL / HTTPS
- Hiện tại Certbot trên VPS đang duy trì chứng chỉ SSL cho `gateway.vinfastmekong.vn`.
- Do tên miền `vinfastmekong.vn` và `www.vinfastmekong.vn` hiện đang trỏ DNS về Netlify, Certbot chưa thể cấp phát chứng chỉ SSL trên VPS qua phương thức HTTP-01 challenge.
- **Kế hoạch cấp SSL:** Ngay sau khi chuyển DNS về IP VPS `103.72.97.120`, thực thi lệnh:
  ```bash
  certbot --nginx -d vinfastmekong.vn -d www.vinfastmekong.vn
  ```
  Quá trình này diễn ra tự động trong ~30 giây.

### 14. DNS STATUS
- `vinfastmekong.vn`: Đang trỏ A record về `75.2.60.5` (Netlify).
- `www.vinfastmekong.vn`: Đang trỏ CNAME về `vinfastxanhmekong.netlify.app`.
- **IP VPS đích sẵn sàng tiếp nhận:** `103.72.97.120`.

### 15. HEALTHCHECK VERIFICATION
- Endpoint nội bộ: `http://127.0.0.1:3000/api/health`
- Kết quả phản hồi thực tế:
  ```json
  HTTP/1.1 200 OK
  Content-Type: application/json
  {"status":"ok","service":"vinfastmekong-web","timestamp":"2026-11-06T09:36:59.481Z"}
  ```
- Trạng thái Docker Health: **`healthy`** (chu kỳ 15s, timeout 5s, 3 retries).

### 16. LOCAL / CONTAINER VALIDATION TESTS
Các kiểm thử đã thực thi trực tiếp trên container tại VPS:
1. `GET /api/health`: HTTP 200 OK.
2. `GET /` (Trang chủ với `Host: www.vinfastmekong.vn`): HTTP 200 OK, dung lượng 271,845 bytes, Next.js ISR cache `HIT`.
3. `GET /` (Non-www với `Host: vinfastmekong.vn`): HTTP 301 Moved Permanently chuyển hướng sang `https://www.vinfastmekong.vn/`.
4. `GET /robots.txt`: HTTP 200 OK.
5. `GET /sitemap.xml`: HTTP 200 OK.
6. `GET /about`: HTTP 200 OK.

### 17. PRODUCTION INTEGRATION TESTS
- Kiểm tra truy vấn từ máy ngoài Internet tới IP VPS `http://103.72.97.120/api/health` với Host Header `www.vinfastmekong.vn`: **HTTP 200 OK** thông qua Nginx.
- Kiểm tra truy vấn trang chủ `http://103.72.97.120/`: **HTTP 200 OK** (`x-nextjs-cache: HIT`).

### 18. VPS RESOURCE & PERFORMANCE IMPACT CHECK
| Chỉ số | Trước khi chạy Website | Khi Website đang chạy | Nhận xét |
| :--- | :---: | :---: | :--- |
| **RAM tổng** | 3.8 GiB | 3.8 GiB | Ổn định |
| **RAM khả dụng (Available)** | 3.2 GiB | **2.9 GiB** | Dư dả hơn 75% dung lượng |
| **RAM tiêu thụ (`vinfastmekong-web`)** | — | **87.24 MiB** (Limit: 1 GiB) | Cực kỳ nhẹ (~8.5% quota) |
| **CPU tiêu thụ (`vinfastmekong-web`)** | — | **< 0.5%** (Idle) | Không gây tải CPU |
| **Dung lượng ổ cứng `/dev/sda2`** | 9.8 GB / 40 GB (25%) | 10.6 GB / 40 GB (27%) | Dư hơn 29 GB trống |

### 19. BOS ISOLATION VERIFICATION
- **BOS Backend (`bos_backend-backend-1`):**
  - Trạng thái: `Up (healthy)`, uptime duy trì liên tục.
  - Memory: 40.28 MiB.
  - Health check `curl http://127.0.0.1:3001/health`: **HTTP 200 OK** `{"status":"ok","uptimeSeconds":2218}`.
- **BOS PostgreSQL (`bos_backend-postgres-1`):**
  - Trạng thái: `Up (healthy)`.
  - Memory: 25.33 MiB.
- **BOS Gateway Virtual Host:**
  - `gateway.vinfastmekong.vn` trên Nginx vẫn proxy chuẩn xác tới port 3001, chứng chỉ SSL nguyên vẹn 100%.

### 20. ROLLBACK PROCEDURE
Nếu có bất kỳ sự cố nào xảy ra trong hoặc sau quá trình chuyển giao:
- **Phương án Rollback 1 (Chuyển nhanh DNS):** Đổi lại A record của `vinfastmekong.vn` về IP Netlify (`75.2.60.5`) và CNAME của `www.vinfastmekong.vn` về `vinfastxanhmekong.netlify.app`. Lưu lượng sẽ lập tức quay về Netlify trong vài phút mà không cần can thiệp server.
- **Phương án Rollback 2 (Dừng container website trên VPS):**
  ```bash
  cd /opt/vinfastmekong.vn
  docker compose down
  ```
  Lệnh này chỉ tắt container website, hoàn toàn không ảnh hưởng tới BOS Backend hay PostgreSQL.

### 21. KNOWN LIMITATIONS & NOTES
- Cần hoàn tất chuyển đổi DNS trước khi chạy Certbot để cấp SSL HTTPS chính thức trên VPS.
- Google Ads traffic (>10,000 clicks/tháng) ước tính trung bình ~0.02 - 1 request/giây. Với cơ chế Next.js Standalone + ISR Cache (HTML tĩnh được phục vụ trực tiếp với bộ nhớ tiêu thụ chỉ ~87 MiB), hệ thống VPS hiện tại dư khả năng đáp ứng mượt mà và an toàn tài nguyên.

---

### 22. TRẠNG THÁI CUỐI CÙNG: `READY WITH CONDITIONS`
Hệ thống website đã được Docker hóa và triển khai thành công trên VPS Production ở chế độ Standalone Container, đã cấu hình Nginx Reverse Proxy và kiểm tra hoạt động trơn tru. Sẵn sàng cut-over sang VPS ngay khi Chủ dự án thực hiện cập nhật bản ghi DNS.

