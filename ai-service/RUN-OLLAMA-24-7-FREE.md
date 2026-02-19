# Chạy AI Code Agent (Ollama) 24/7 miễn phí – thay thế Google Colab

Tính năng **AI Code Agent Assistant** dùng **Ollama** (deepseek-coder, codellama). Hiện tại bạn chạy Ollama trên **Google Colab** + **Ngrok**; Colab hết phiên ~12h nên không 24/7. Dưới đây là các cách **miễn phí** để chạy **24/24**.

---

## Khuyến nghị cho Đồ án tốt nghiệp

Với **đồ án tốt nghiệp**, cần ổn định khi bảo vệ và dễ trình bày trong báo cáo. Cách tối ưu:

| Mục đích | Cách làm | Lý do |
|----------|----------|--------|
| **Triển khai chính (demo / hội đồng xem online)** | **Oracle Cloud Free Tier** | VM 24/7, URL cố định, không phụ thuộc Colab; thể hiện "triển khai trên cloud" trong báo cáo. |
| **Phát triển hàng ngày** | **Ollama trên PC** (`localhost:11434`) | Nhanh, không tốn băng thông, không cần VM khi code. |
| **Dự phòng ngày bảo vệ** | Giữ **Ollama local** sẵn + biết đổi nhanh `OLLAMA_BASE_URL` | Nếu Oracle lỗi hoặc mạng trường chặn, chuyển sang local trong 1 phút. |

**Trình tự gợi ý:**

1. **Ngay từ giờ:** Cài Ollama trên PC, dùng `OLLAMA_BASE_URL=http://localhost:11434` cho dev.
2. **Trước khi nộp / demo 2–3 tuần:** Tạo VM Oracle Cloud, cài Ollama, cấu hình systemd, cập nhật `.env.local` (và biến môi trường production nếu deploy Next.js).
3. **Trước ngày bảo vệ 1–2 ngày:** Kiểm tra kết nối từ trình duyệt/Postman tới `OLLAMA_BASE_URL`; chạy thử đầy đủ tính năng AI (chat, autocomplete, generate code).
4. **Trong báo cáo:** Mô tả kiến trúc (Next.js ↔ Ollama), nêu rõ "Ollama được triển khai trên Oracle Cloud Infrastructure (Always Free Tier)" và (nếu có) "phát triển sử dụng Ollama local".

**Checklist trước ngày bảo vệ:**

- [ ] VM Oracle (hoặc server chính) đang chạy; `systemctl status ollama` (nếu dùng systemd) báo active.
- [ ] Từ máy khác (hoặc 4G): mở `http://<IP>:11434/api/tags` thấy JSON list models.
- [ ] Trong app: Settings → Kiểm tra kết nối AI → trạng thái "Đã kết nối".
- [ ] Đã lưu sẵn IP/URL và cách đổi `OLLAMA_BASE_URL` sang local nếu cần (file `.env.local` backup hoặc ghi trong tài liệu hướng dẫn chạy).

---

## So sánh nhanh

| Cách | Chi phí | 24/7 | Độ khó | Ghi chú |
|------|--------|------|--------|--------|
| **1. Máy tính cá nhân (PC/laptop)** | 0đ | ✅ Khi máy bật | Dễ | Tốt nhất cho dev/cá nhân |
| **2. Oracle Cloud Free Tier** | 0đ | ✅ | Trung bình | VM free vĩnh viễn, phù hợp production nhỏ |
| **3. Chuyển sang Groq API** | Free tier | ✅ | Cần sửa code | Không cần server, có giới hạn request |

---

## 1. Chạy Ollama trên máy tính cá nhân (khuyến nghị cho dev)

**Ưu điểm:** Miễn phí, đơn giản, 24/7 nếu máy luôn bật (hoặc bật khi cần học).

### Bước 1: Cài Ollama

- **Windows:** Tải [ollama.com](https://ollama.com) → cài đặt → chạy Ollama (chạy nền, listen `http://localhost:11434`).
- **Mac/Linux:** `curl -fsSL https://ollama.com/install.sh | sh` rồi `ollama serve` (hoặc chạy service).

### Bước 2: Pull model

```bash
ollama pull deepseek-coder:1.3b
ollama pull codellama:13b-instruct
```

### Bước 3: Dùng trong app

- **Chỉ dùng trên cùng máy (localhost):**  
  Trong `.env.local`:
  ```env
  OLLAMA_BASE_URL=http://localhost:11434
  ```
  Không cần Ngrok.

- **Truy cập từ máy khác / internet (24/7 khi PC bật):**
  - **Cloudflare Tunnel (free, ổn định):**  
    Cài [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/), tạo tunnel tới `localhost:11434`, dùng URL do Cloudflare cấp làm `OLLAMA_BASE_URL`.
  - **Ngrok (free):**  
    Chạy `ngrok http 11434`, copy URL (free tier URL đổi mỗi lần chạy) vào `OLLAMA_BASE_URL`.

---

## 2. Oracle Cloud Free Tier – VM chạy 24/7 miễn phí

**Always Free** gồm: 4 OCPU + 24GB RAM (Ampere ARM) hoặc 2 VM AMD 1GB. Khuyến nghị dùng **1 VM ARM 4 OCPU + 24GB RAM** để chạy Ollama ổn định.

### Bước 1: Tạo tài khoản và VM

1. Đăng ký [Oracle Cloud Free Tier](https://www.oracle.com/cloud/free/).
2. Tạo **Compute Instance**: Ubuntu 22.04, shape **Ampere A1** (4 OCPU, 24GB RAM).
3. Mở port **22** (SSH) và **11434** (Ollama) trong Security List / VCN (ingress rules).

### Bước 2: Trên VM (SSH vào)

```bash
# Cài Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Chạy Ollama listen cả external (để app gọi qua public IP)
export OLLAMA_HOST=0.0.0.0:11434
ollama serve &

# Pull models (giống Colab)
ollama pull deepseek-coder:1.3b
ollama pull codellama:13b-instruct
```

### Bước 3: Cấu hình app

Trong `.env.local`:

```env
OLLAMA_BASE_URL=http://<PUBLIC_IP_VM>:11434
OLLAMA_COMPLETION_MODEL=deepseek-coder:1.3b
OLLAMA_CHAT_MODEL=codellama:13b-instruct
```

Thay `<PUBLIC_IP_VM>` bằng địa chỉ IP public của instance (xem trên Oracle Console).  
**Lưu ý:** Ollama mặc định **không** HTTPS. Nếu cần HTTPS hoặc không muốn mở port 11434 ra internet, đặt Nginx (reverse proxy) + SSL hoặc dùng Cloudflare Tunnel từ VM ra Cloudflare (free).

### Giữ Ollama chạy sau khi thoát SSH

Dùng `systemd` hoặc `screen`/`tmux`:

```bash
# Ví dụ systemd (tạo file /etc/systemd/system/ollama.service)
[Unit]
Description=Ollama
After=network.target

[Service]
ExecStart=/usr/local/bin/ollama serve
Environment="OLLAMA_HOST=0.0.0.0:11434"
Restart=always
User=ubuntu

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable ollama && sudo systemctl start ollama
```

---

## 3. Chuyển sang Groq API (không cần server 24/7)

Nếu không muốn tự host Ollama, có thể dùng **Groq** (free tier) cho **chat / generate code**. Phần **autocomplete (FIM)** có thể giữ Ollama local hoặc tắt tạm.

- **Ưu:** Không cần Colab/Oracle/PC 24/7, luôn sẵn sàng.
- **Nhược:** Cần sửa code (Next.js API routes + `lib/ollama` hoặc tạo client Groq cho chat); free tier có giới hạn request/phút; Groq có thể không có endpoint FIM giống Ollama.

Nếu bạn chọn hướng này, có thể:
- Giữ Ollama cho **autocomplete** (chạy local khi dev).
- Dùng Groq cho **chat** và **generate code** (gọi từ Next.js với `GROQ_API_KEY`).

---

## Tóm tắt

- **Đồ án tốt nghiệp:** Dùng **Oracle Cloud Free Tier** làm server Ollama chính cho demo/bảo vệ; **Ollama local** cho dev và dự phòng ngày bảo vệ (xem mục [Khuyến nghị cho Đồ án tốt nghiệp](#khuyến-nghị-cho-đồ-án-tốt-nghiệp) trên).
- **Dùng hàng ngày trên 1 máy:** Chạy **Ollama trên PC/laptop** + `OLLAMA_BASE_URL=http://localhost:11434` là đơn giản và miễn phí nhất.
- **Cần link 24/7 từ nhiều thiết bị / không muốn mở Colab:** Dùng **Oracle Cloud Free Tier** (1 VM ARM 4 OCPU + 24GB) chạy Ollama; hoặc expose PC qua **Cloudflare Tunnel** / Ngrok khi PC bật.
- **Không muốn vận hành server:** Cân nhắc **Groq API** cho chat/generate (cần chỉnh code), autocomplete có thể giữ Ollama local hoặc tắt.

Sau khi chọn phương án, chỉ cần cập nhật `OLLAMA_BASE_URL` (và model nếu đổi) trong `.env.local`; app hiện tại đã tương thích.
