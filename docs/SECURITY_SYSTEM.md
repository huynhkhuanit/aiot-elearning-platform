# Thiết lập Hệ thống Bảo mật — DHVLearnX Platform

> Tài liệu mô tả cơ chế bảo mật đã triển khai trong hệ thống AIoT E-Learning Platform.

---

## 1. Tổng quan kiến trúc bảo mật

Hệ thống bảo mật được triển khai theo mô hình **Defense-in-Depth** (phòng thủ nhiều lớp), gồm **7 tầng bảo vệ** hoạt động đồng thời:

```
Request → [Security Headers] → [CORS Whitelist] → [Rate Limiter]
       → [CSRF Validation] → [JWT Authentication] → [Role Authorization]
       → [XSS Sanitization] → Response
```

### Sơ đồ kiến trúc

```
┌──────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────────┐  │
│  │ CSRF Token auto │  │ HTTP-only Cookie │  │ secureFetch()  │  │
│  │ fetch on mount  │  │ (auth_token)     │  │ wrapper        │  │
│  └────────┬────────┘  └────────┬────────┘  └───────┬────────┘  │
└───────────┼─────────────────────┼───────────────────┼───────────┘
            │                     │                   │
            ▼                     ▼                   ▼
┌──────────────────────────────────────────────────────────────────┐
│                    MIDDLEWARE (Edge Runtime)                      │
│                                                                  │
│  ① Security Headers (CSP, HSTS, X-Frame-Options, ...)           │
│  ② CORS Whitelist (chỉ cho phép domain tin cậy)                 │
│  ③ CSRF Validation (Double Submit Cookie)                        │
│  ④ Route Protection (redirect nếu chưa đăng nhập)               │
└──────────────────────────────────┬───────────────────────────────┘
                                   │
                                   ▼
┌──────────────────────────────────────────────────────────────────┐
│                    API ROUTE HANDLERS                            │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ withAuth() HOF — Unified Security Pipeline              │    │
│  │  ⑤ Rate Limiting (IP-based, per-endpoint config)        │    │
│  │  ⑥ JWT Verify → Extract user payload                    │    │
│  │  ⑦ Role Check (student / instructor / admin)            │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐     │
│  │ Audit Logger │  │ Env Validate │  │ HTML Sanitizer    │     │
│  │ (fire&forget)│  │ (Zod schema) │  │ (XSS prevention) │     │
│  └──────────────┘  └──────────────┘  └───────────────────┘     │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. Chi tiết từng lớp bảo mật

### 2.1. Security Headers

**File:** `src/middleware.ts` — hàm `setSecurityHeaders()`

Mọi HTTP response từ server đều được gắn 7 header bảo mật:

| Header | Giá trị | Mục đích |
|--------|---------|----------|
| `X-Frame-Options` | `DENY` | Chống tấn công **Clickjacking** — cấm nhúng trang vào iframe |
| `X-Content-Type-Options` | `nosniff` | Chống **MIME Sniffing** — buộc browser phải tôn trọng Content-Type |
| `X-XSS-Protection` | `1; mode=block` | Kích hoạt bộ lọc XSS tích hợp trong trình duyệt cũ |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | Buộc sử dụng **HTTPS** trong 1 năm, bao gồm subdomain |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Kiểm soát thông tin referrer gửi đi khi cross-origin |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Cấm truy cập phần cứng (camera, mic, GPS) từ trang web |
| `Content-Security-Policy` | Whitelist chi tiết | Cho phép tải resource chỉ từ domain đáng tin cậy |

**Content-Security-Policy (CSP)** được cấu hình chi tiết:
- `script-src`: chỉ cho phép script từ `self` và `cdn.jsdelivr.net`
- `img-src`: cho phép ảnh từ Cloudinary, Unsplash, YouTube thumbnails
- `connect-src`: chỉ cho phép API calls tới `*.supabase.co`
- `frame-src`: chỉ cho phép iframe từ YouTube (cho video bài giảng)

---

### 2.2. CORS (Cross-Origin Resource Sharing)

**File:** `src/middleware.ts` — hàm `setCorsHeaders()`, `isAllowedOrigin()`

Thay vì sử dụng wildcard (`*`) cho phép mọi origin, hệ thống áp dụng **whitelist** các domain được phép:

```typescript
const ALLOWED_ORIGINS = [
    "https://dhvlearnx.page",       // Production domain
    "https://www.dhvlearnx.page",   // www subdomain
    "http://localhost:3000",         // Dev server
    process.env.NEXT_PUBLIC_MOBILE_APP_ORIGIN, // Mobile app
];
```

- **Production:** chỉ cho phép request từ domain chính thức.
- **Development:** cho phép tất cả origin để thuận tiện phát triển.
- Request từ origin không nằm trong whitelist sẽ **không nhận header** `Access-Control-Allow-Origin`, trình duyệt tự động chặn response.

---

### 2.3. CSRF Protection (Cross-Site Request Forgery)

**File:** `src/lib/csrf.ts`

Triển khai theo pattern **Double Submit Cookie**:

**Luồng hoạt động:**
1. Client gọi `GET /api/auth/csrf` khi khởi tạo ứng dụng
2. Server tạo CSRF token ngẫu nhiên (32 bytes, hex) bằng `crypto.randomBytes()`
3. Token được lưu vào cookie `csrf_token` (readable bởi JavaScript, `SameSite=Strict`)
4. Với mỗi request thay đổi dữ liệu (POST/PUT/PATCH/DELETE):
   - Client đọc token từ cookie → gửi kèm trong header `X-CSRF-Token`
   - Middleware **so sánh** giá trị cookie vs header bằng `crypto.timingSafeEqual()` (chống timing attack)
   - Nếu không khớp → **trả về 403 Forbidden**

**Các endpoint miễn kiểm tra CSRF:** Login, Register, Logout (vì chưa có session).

---

### 2.4. Xác thực JWT (JSON Web Token)

**File:** `src/lib/auth.ts`, `src/lib/env-validation.ts`

**Cơ chế xác thực:**
- Sử dụng thư viện `jsonwebtoken` để ký và xác minh token
- Token được ký bằng thuật toán HMAC-SHA256 với secret key từ biến môi trường `JWT_SECRET`
- JWT được lưu trong **HTTP-only cookie** (`auth_token`) — JavaScript không thể đọc, chống XSS đánh cắp token
- Token **không bao giờ trả về** trong response body — chỉ truyền qua cookie

**Payload chứa trong JWT:**
```typescript
interface AuthPayload {
    userId: string;     // UUID người dùng
    email: string;      // Email đăng nhập
    username: string;   // Username
}
```

**Bảo vệ JWT Secret:**
- Hàm `getJWTSecret()` bắt buộc JWT_SECRET phải tồn tại và tối thiểu 32 ký tự
- Trong production: nếu thiếu JWT_SECRET → **crash ngay lập tức** (fail-fast)
- Loại bỏ hoàn toàn fallback secret cố định — ngăn chặn tấn công khi quên cấu hình env

---

### 2.5. Rate Limiting (Giới hạn tần suất)

**File:** `src/lib/rateLimit.ts`

Triển khai cơ chế **Sliding Window Counter** trên bộ nhớ (in-memory Map), giới hạn số request theo IP cho từng loại endpoint:

| Endpoint | Giới hạn | Cửa sổ | Mục đích |
|----------|----------|--------|----------|
| Login | 5 lần | 1 phút | Chống brute-force mật khẩu |
| Register | 3 lần | 10 phút | Chống tạo tài khoản hàng loạt |
| Forgot Password | 3 lần | 15 phút | Chống spam OTP |
| Change Password | 5 lần | 1 phút | Chống brute-force password cũ |
| General API | 60 lần | 1 phút | Chống DoS tổng quát |
| File Upload | 10 lần | 1 phút | Chống abuse storage |
| AI Endpoints | 20 lần | 1 phút | Bảo vệ tài nguyên AI (tốn kém) |
| Blog/Content | 5 lần | 1 phút | Chống spam nội dung |

Khi vượt giới hạn → trả về **HTTP 429 Too Many Requests** kèm header `Retry-After`.

---

### 2.6. Phân quyền dựa trên vai trò (RBAC)

**File:** `src/lib/api-middleware.ts` — hàm `withAuth()`

Higher-Order Function (HOF) `withAuth()` thực hiện pipeline bảo mật thống nhất cho mọi API route:

```
Request → Rate Limit → CSRF Check → JWT Verify → Load Roles → Role Check → Handler
```

**Hệ thống vai trò:**
- `student` — Vai trò mặc định
- `instructor` — Giảng viên (tạo khóa học, quản lý bài giảng)
- `admin` — Quản trị viên (toàn quyền)

Roles được lưu trong bảng `user_roles` trên Supabase, query theo `user_id` và lọc bản ghi chưa bị thu hồi (`revoked_at IS NULL`).

**Ví dụ sử dụng:**
```typescript
// Chỉ admin mới có quyền xóa khóa học
export const DELETE = withAuth(
    async (request, { user, roles }) => {
        // Logic xử lý...
    },
    { roles: ["admin"], rateLimit: RATE_LIMITS.general }
);
```

---

### 2.7. Chống XSS (Cross-Site Scripting)

**File:** `src/lib/sanitize.ts`

Xử lý nội dung người dùng trước khi render bằng `dangerouslySetInnerHTML`:

**Phương pháp:**
1. **Loại bỏ hoàn toàn** thẻ `<script>` và nội dung bên trong
2. **Xóa** tất cả event handler (`onclick`, `onerror`, `onload`, ...)
3. **Vô hiệu hóa** URL `javascript:` trong thuộc tính `href`/`src`
4. **Chặn** URL `data:` không phải ảnh (ngăn script injection qua data URI)
5. **Xóa** CSS expression (chống code execution qua `style`)
6. **Loại bỏ** các thẻ nguy hiểm: `<iframe>`, `<object>`, `<embed>`, `<form>`, `<svg>`, `<math>`

**Áp dụng tại các component:**
- Trang viết blog (`/write`) — nội dung từ trình soạn thảo TipTap

---

## 3. Hạ tầng bảo mật bổ sung

### 3.1. Audit Logging (Ghi log bảo mật)

**File:** `src/lib/audit-log.ts`

Ghi lại mọi hành động nhạy cảm vào bảng `security_audit_log` trên Supabase:

| Hành động | Mô tả |
|-----------|-------|
| `LOGIN_SUCCESS` / `LOGIN_FAILED` | Theo dõi đăng nhập thành công và thất bại |
| `ACCOUNT_LOCKED` | Tài khoản bị khóa do đăng nhập sai quá nhiều |
| `PASSWORD_RESET_REQUESTED` | Yêu cầu đặt lại mật khẩu |
| `REGISTER` | Đăng ký tài khoản mới |
| `ROLE_CHANGED` | Thay đổi vai trò người dùng |
| `CSRF_VIOLATION` | Phát hiện CSRF token không hợp lệ |
| `RATE_LIMIT_HIT` | Vượt giới hạn tần suất request |
| `SUSPICIOUS_ACTIVITY` | Phát hiện hoạt động bất thường |

**Đặc điểm:** Hoạt động theo cơ chế **fire-and-forget** — không bao giờ chặn luồng xử lý chính, đảm bảo hiệu năng hệ thống.

### 3.2. Xác thực biến môi trường

**File:** `src/lib/env-validation.ts`

Sử dụng **Zod schema** để validate tất cả biến môi trường khi khởi động:

| Biến | Yêu cầu |
|------|---------|
| `JWT_SECRET` | Bắt buộc, tối thiểu 32 ký tự |
| `NEXT_PUBLIC_SUPABASE_URL` | Bắt buộc, phải là URL hợp lệ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Bắt buộc |
| `SUPABASE_SERVICE_ROLE_KEY` | Bắt buộc |

Nếu thiếu biến bắt buộc trong production → **server từ chối khởi động** (fail-fast), tránh chạy với cấu hình không an toàn.

---

## 4. Tóm tắt các file bảo mật

```
src/
├── middleware.ts              # Security Headers + CORS + CSRF + Route Protection
├── lib/
│   ├── auth.ts                # JWT sign/verify (bcrypt + jsonwebtoken)
│   ├── auth-helpers.ts        # JWT verify cho dynamic routes
│   ├── csrf.ts                # CSRF token generation & validation
│   ├── rateLimit.ts           # Rate limiting (8 cấu hình)
│   ├── sanitize.ts            # HTML/URL sanitization chống XSS
│   ├── api-middleware.ts      # withAuth() HOF — unified security pipeline
│   ├── env-validation.ts      # Zod env validation + getJWTSecret()
│   └── audit-log.ts           # Security audit logging service
├── contexts/
│   └── AuthContext.tsx         # CSRF auto-fetch + secureFetch wrapper
└── app/api/auth/
    └── csrf/route.ts           # CSRF token endpoint
```

---

## 5. Chuẩn bảo mật tham chiếu

Hệ thống bảo mật được thiết kế dựa trên các tiêu chuẩn:

- **OWASP Top 10 (2021)** — Giải quyết A01 (Broken Access Control), A02 (Cryptographic Failures), A03 (Injection/XSS), A05 (Security Misconfiguration), A07 (Authentication Failures)
- **OWASP CSRF Prevention Cheat Sheet** — Double Submit Cookie pattern
- **NIST SP 800-63B** — Hướng dẫn xác thực số (bcrypt, key length)
- **MDN Web Security Guidelines** — Security Headers best practices
