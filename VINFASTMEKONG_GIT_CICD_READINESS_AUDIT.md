# BOS SYSTEM — VINFAST XANH MEKONG
## PHASE: VINFASTMEKONG.VN — GIT + CI/CD READINESS AUDIT

---

### 1. REPOSITORY STATE

- **Repository**: `D:/dev/VF-ô tô/VinfastXanhMekong`
- **Current Branch**: `main`
- **Remote Origin**: `https://github.com/vinfastxanhmekongauto/vinfastxanhmekong.git` (fetch & push)
- **Current HEAD**: `aa9e56f fix(email): migrate resend sender to verified domain vinfastmekong.vn`
- **Recent Git Log**:
  - `aa9e56f` fix(email): migrate resend sender to verified domain vinfastmekong.vn
  - `22e5fb9` feat(email): support multiple admin notification recipients
  - `613bf17` chore(crm): remove BOS cron retry mechanism
  - `76518f5` feat(crm): add async BOS secondary lead sync and secure retry
  - `189acd8` refactor(notifications): remove Zalo OA internal notification integration
- **Working Tree Status**:
  - **Modified (Unstaged - 2 files)**:
    - `.gitignore` (+1 line: `!.env.example`)
    - `next.config.ts` (+1 line: `output: 'standalone'`)
  - **Staged in Git Index (23 files preserved intact)**:
    - Admin manual feature & editor: `app/(admin)/admin/huong-dan/**`, `app/(admin)/layout.tsx`, `app/(client)/dich-vu/huong-dan-su-dung/page.tsx`, `components/TiptapEditor.tsx`
    - Audit evidence: `audit-evidence/phase-1-2/*.png` (12 files)
    - Prior audit reports: `phase_1_4_production_release_report.md`, `phase_1_4_1_production_release_report.md`, `website_comprehensive_conversion_audit_phase_1_2.md`, `website_comprehensive_conversion_audit_phase_1_3.md`
  - **Untracked files (New Docker & Deployment Hardening)**:
    - `Dockerfile`
    - `docker-compose.yml`
    - `docker-compose.production.yml`
    - `.dockerignore`
    - `.env.example`
    - `app/api/health/route.ts`
    - `deployment/nginx-vinfastmekong.vn.conf`
    - `.github/workflows/production-deploy.yml`
    - Reports: `VINFASTMEKONG_PRODUCTION_DEPLOYMENT_REPORT.md`, `VINFASTMEKONG_CUTOVER_READINESS_REPORT.md`

---

### 2. DOCKER READINESS

- **Docker Engine Native Compatibility**: `PASS`. Tested natively on VPS Ubuntu 24.04 (`Docker Engine 29.9.2`, `Compose v5.6.1`). Zero Docker Desktop dependency.
- **Multi-Stage Dockerfile**:
  - **Stage 1 (deps)**: `node:20-alpine`, `apk add libc6-compat`, `npm ci`.
  - **Stage 2 (builder)**: `npm run build`, Standalone output, build-time args for public envs (`NEXT_PUBLIC_*`), memory optimization (`NEXT_CPU_NUM=2`, `NODE_OPTIONS="--max-old-space-size=2560"`).
  - **Stage 3 (runner)**: `node:20-alpine`, non-root user `nextjs:nodejs` (UID/GID 1001), `curl` healthcheck, `CMD ["node", "server.js"]`.
- **Runtime User**: Non-root `USER nextjs`.
- **Image Footprint**: Standalone bundle **94.7 MB** (tối ưu cao, không chứa `node_modules` thừa).
- **Healthcheck**: Tích hợp `HEALTHCHECK CMD curl -f http://127.0.0.1:3000/api/health || exit 1`. Đã kiểm chứng trả về HTTP 200 `{"status":"ok","service":"vinfastmekong-web"}`.
- **Image Secrets**: Không chứa secret trong image (chỉ inject build ARGs cho public client variables).
- **Production Container Bind-Mount**: Không yêu cầu bind mount mã nguồn từ host. Chạy độc lập hoàn toàn.
- **Compose Specs**:
  - Service: `web`
  - Container name: `vinfastmekong-web`
  - Network: `vinfastmekong_net` (Bridge riêng biệt, IP `172.18.0.2`)
  - Restart Policy: `unless-stopped`
  - Port binding: `127.0.0.1:3000:3000` (Loopback nội bộ)
  - Resources: `limits: cpus 2.0, memory 1024M`; `reservations: memory 256M`.
- **Database & BOS Isolation**:
  - Website kết nối **Supabase độc lập** qua REST/HTTPS API.
  - Hoàn toàn KHÔNG kết nối tới mạng nội bộ BOS (`bos_backend_bos_internal_net`).
  - Hoàn toàn KHÔNG truy cập PostgreSQL BOS (port `5432`) hoặc backend BOS (port `3001`).

---

### 3. GIT HYGIENE

- **Secret Leak Scan**: Đã quét toàn bộ repository bằng `git grep` và scan `git diff --cached`. Kết quả: **ZERO secret bị lộ**.
- **Excluded Patterns**:
  - `.env`, `.env.local`, `.env.production` đều được `.gitignore` loại trừ (`.env*`).
  - `.dockerignore` bảo vệ nghiêm ngặt không đưa `.env`, `.next/`, `node_modules/`, `audit-evidence/` vào Docker build context.
- **Safe Template**: `.env.example` tồn tại và chỉ chứa các placeholder an toàn (`your-supabase-anon-key-here`, `G-XXXXXXXXXX`, `re_xxxxxxxxxxx`).
- **No Private Keys / Certificates**: Không có private key, SSH key hay SSL certificate nào trong Git index hoặc working directory.

---

### 4. CI/CD HIỆN TRẠNG

- **Kiểm tra `.github/workflows/`**: Trước khi thực hiện audit, thư mục `.github/` chưa từng tồn tại trên repository Git.
- **Kết luận**:
  ```text
  CI/CD STATUS = NOT IMPLEMENTED
  ```

---

### 5. GITHUB ACTIONS HIỆN CÓ

- Chưa có bất kỳ GitHub Actions workflow nào đang chạy trên remote repository.
- Toàn bộ các lần phát hành trước đây được thực hiện thủ công hoặc thông qua Vercel/Netlify Git integration.

---

### 6. CI/CD MISSING ITEMS (HẠNG MỤC CÒN THIẾU)

1. **Workflow Configuration**: Cần file workflow `.github/workflows/production-deploy.yml` để định nghĩa pipeline CI/CD.
2. **GitHub Repository Secrets**: Chưa được cấu hình trên GitHub repo settings:
   - `VPS_HOST`
   - `VPS_PORT`
   - `VPS_USER`
   - `VPS_SSH_PRIVATE_KEY`
3. **VPS Git Checkout Tracking**: Thư mục `/opt/vinfastmekong.vn` trên VPS hiện tại được tạo bằng đồng bộ file trực tiếp, chưa khởi tạo Git tracking repo (`.git`).

---

### 7. PROPOSED DEPLOYMENT WORKFLOW

Đã thiết kế và chuẩn bị file `.github/workflows/production-deploy.yml` với kiến trúc 2 giai đoạn:

```mermaid
flowchart TD
    A["Push to main"] --> B["Quality Gate (GitHub Runner)"]
    B --> C["npm ci"]
    C --> D["TypeScript Typecheck (tsc --noEmit)"]
    D --> E["ESLint Code Quality (Advisory Mode)"]
    E --> F["Deploy Stage (SSH Action to VPS)"]
    F --> G["Verify /opt/vinfastmekong.vn/.env"]
    G --> H["Git Checkout / Sync Exact Release SHA"]
    H --> I["docker compose build"]
    I --> J["docker compose up -d --remove-orphans"]
    J --> K["Healthcheck Verification loop (HTTP 200 on /api/health)"]
    K -->|Success| L["Deploy Succeeded"]
    K -->|Fail| M["Automatic Rollback & Exit 1"]
```

#### Chi tiết các bước thực hiện trên Production VPS:
1. SSH kết nối vào VPS qua cổng `24700` bằng SSH Private Key an toàn.
2. Chuyển vào `/opt/vinfastmekong.vn`.
3. Kiểm tra bắt buộc file `.env` đã có sẵn trên VPS (`chmod 600 .env`), tuyệt đối không ghi đè bằng Git.
4. Đồng bộ mã nguồn theo đúng Git commit SHA (`${{ github.sha }}`).
5. Thực hiện `docker compose -f docker-compose.production.yml build`.
6. Khởi động lại container bằng `docker compose -f docker-compose.production.yml up -d --remove-orphans`.
7. Kiểm tra vòng lặp healthcheck 12 lần (tổng 60s) đến `http://127.0.0.1:3000/api/health`. Nếu không đạt HTTP 200, kích hoạt rollback và báo lỗi.
8. Tuyệt đối KHÔNG chạy `docker system prune -a` trên VPS để tránh xóa nhầm cache hoặc images của BOS.

---

### 8. GITHUB SECRETS REQUIRED

Chủ dự án cần bổ sung 4 secrets sau vào **GitHub Repository > Settings > Secrets and variables > Actions**:

| Secret Name | Mô tả | Giá trị đề xuất |
| :--- | :--- | :--- |
| `VPS_HOST` | Địa chỉ IP máy chủ Production | `103.72.97.120` |
| `VPS_PORT` | Cổng SSH bảo mật của VPS | `24700` |
| `VPS_USER` | Tài khoản SSH triển khai | `root` (hoặc deploy user có quyền docker) |
| `VPS_SSH_PRIVATE_KEY` | Khóa SSH Private Key kết nối không cần mật khẩu | `-----BEGIN OPENSSH PRIVATE KEY----- ...` |

---

### 9. VPS DEPLOYMENT DIRECTORY & ENVIRONMENT

- Thư mục triển khai chính thức: `/opt/vinfastmekong.vn`
- File biến môi trường Production: `/opt/vinfastmekong.vn/.env` (được bảo vệ `chmod 600`, độc lập với Git).
- Runtime: Native Docker Engine `29.9.2` + Docker Compose `v5.6.1`.

---

### 10. DOCKER & BOS ISOLATION

- **Container Website**: `vinfastmekong-web`
- **Network Website**: `vinfastmekongvn_vinfastmekong_net` (`172.18.0.0/16`)
- **Container BOS**: `bos_backend-backend-1` (`127.0.0.1:3001`), `bos_backend-postgres-1` (`127.0.0.1:5432`)
- **Network BOS**: `bos_backend_bos_internal_net`
- **Cam kết an toàn**: Workflow CI/CD hoàn toàn chỉ giới hạn trong `/opt/vinfastmekong.vn`, không chạm vào `/opt/bos_backend`, không gọi `docker compose down` toàn cục, không restart BOS.

---

### 11. GA4 / GOOGLE ADS PRESERVATION

Đã kiểm tra chi tiết toàn bộ source code tích hợp tracking:
- `NEXT_PUBLIC_GA_ID`: Được cấu hình tại `app/layout.tsx` (`<GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />`) và `lib/gtag.ts` (`GA_MEASUREMENT_ID`).
- `NEXT_PUBLIC_BASE_URL` & `NEXT_PUBLIC_SITE_URL`: Được cấu hình trong `lib/constants.ts` và Next.js Metadata.
- Hệ thống đo lường chuyển đổi (`components/client/AttributionTracker.tsx`, `components/client/lead-form.tsx`, `lib/attribution.ts`): Giữ nguyên vẹn 100%, không bị sửa đổi.
- **Kết luận**:
  ```text
  TRACKING CONFIGURATION = PRESERVED
  ```

---

### 12. PRODUCTION CUTOVER STATUS

- **DNS Target Hiện tại**:
  - `vinfastmekong.vn` → `75.2.60.5` (Netlify Edge)
  - `www.vinfastmekong.vn` → CNAME `vinfastxanhmekong.netlify.app`
- **Traffic Destination**: Vẫn đang phục vụ từ Netlify Production.
- **VPS SSL Status**: Chưa cấp phát SSL cho domain trên VPS (Nginx mới mở HTTP port 80 sẵn sàng cho Let's Encrypt HTTP-01 challenge).
- **Kết luận**:
  ```text
  DNS CHANGE = NOT PERFORMED
  SSL ISSUE = NOT PERFORMED
  TRAFFIC CUTOVER = NOT PERFORMED
  ```

---

### 13. SECURITY FINDINGS

1. **Zero Hardcoded Secrets**: Toàn bộ codebase không có khóa bảo mật hay secret key bị lộ.
2. **Local Loopback Binding**: Cổng 3000 của container chỉ bind vào `127.0.0.1:3000`, bảo đảm không bị scan/truy cập trực tiếp từ Internet, mọi truy vấn phải qua Nginx.
3. **Non-root Container User**: Image chạy dưới user unprivileged `nextjs` (UID 1001), hạn chế tối đa rủi ro container breakout.
4. **Isolated Bridge Network**: Tách biệt hoàn toàn khỏi mạng nội bộ của BOS Database.

---

### 14. BLOCKING / ADVISORY ISSUES

1. **Linting Advisory (ESLint)**:
   - Lệnh `npm run lint` (`eslint`) hiện phát hiện 208 lỗi (chủ yếu là `@typescript-eslint/no-explicit-any` trong các trang admin và file script tiện ích cũ như `inspect_all_db.js`, `get_admin.js`).
   - Lệnh kiểm tra kiểu `npx tsc --noEmit` hoàn toàn **PASS 100% (0 lỗi)**.
   - *Xử lý trong CI/CD*: Cấu hình `continue-on-error: true` cho bước ESLint để tránh chặn pipeline triển khai trong khi vẫn báo cáo warning, cho đến khi có sprint dọn dẹp lint riêng.
2. **Git Index Staging Conflict Prevention**:
   - Hiện có 23 files staged từ các phiên làm việc trước (Hướng dẫn sử dụng + tài liệu kiểm thử).
   - Trước khi commit bộ mã nguồn Docker/CI/CD, cần có quyết định: tách 23 file staged này thành một commit riêng (ví dụ `feat(guide): add user guide admin and client pages`) hoặc giữ nguyên staging index khi commit có chủ đích chỉ định từng file cụ thể.
3. **VPS Directory Git Initialization**:
   - Thư mục `/opt/vinfastmekong.vn` trên VPS cần được clone/setup Git remote để lệnh `git checkout $SHA` trong CI/CD hoạt động trơn tru.

---

### 15. RECOMMENDATION & NEXT ACTIONS

1. Khi được phê duyệt Git Release:
   - Commit 1: Đưa 23 file staged hiện tại thành commit tính năng `feat(guide): add user manual pages and audit evidence`.
   - Commit 2: Đưa các file cấu hình Docker, Nginx, Health API và GitHub Actions vào commit hạ tầng `feat(deploy): dockerize website and add github actions production cicd`.
2. Cấu hình 4 GitHub Secrets trên repository (`VPS_HOST`, `VPS_PORT`, `VPS_USER`, `VPS_SSH_PRIVATE_KEY`).
3. Khởi tạo Git repo bên trong `/opt/vinfastmekong.vn` trên VPS.
4. Giữ nguyên Netlify cho đến khi kiểm thử thành công toàn bộ luồng CI/CD và sẵn sàng cấp phát SSL Let's Encrypt trên VPS.

---

### 16. FINAL DECISION

```text
READY WITH CONDITIONS
```
*(Đã sẵn sàng cho Git Release và CI/CD Setup sau khi giải quyết các điều kiện về tách commit staged files và thêm GitHub Secrets).*

