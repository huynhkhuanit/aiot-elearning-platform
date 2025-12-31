# Nền tảng học tập thông minh AIoT - Hệ thống E-Learning tích hợp AI và IoT

> **Đồ án Tốt Nghiệp Chuyên ngành Công nghệ Thông tin**
>
> **Sinh viên thực hiện:** Huỳnh Văn Khuân (MSSV: 2205CT0035)  
> **Lớp:** CT06PM - Khoa Kỹ thuật Công nghệ  
> **Trường:** Đại học Hùng Vương TP. Hồ Chí Minh  
> **Giảng viên hướng dẫn:** ThS. Nguyễn Thanh Tiến
>
> **Repository:** [https://github.com/huynhkhuanit/aiot-elearning-platform](https://github.com/huynhkhuanit/aiot-elearning-platform)  
> **Website:** [https://dhvlearnx.page](https://dhvlearnx.page)

## 📖 Giới thiệu

**Nền tảng học tập thông minh AIoT** là hệ thống E-Learning hiện đại được xây dựng nhằm tạo ra một môi trường học tập trực tuyến thông minh, tích hợp công nghệ Trí tuệ nhân tạo (AI) và Internet of Things (IoT). Dự án tập trung vào việc cung cấp trải nghiệm học tập bài bản, tương tác và cá nhân hóa, đồng thời tích hợp các tính năng điểm danh thông minh và giám sát môi trường học tập.

Hệ thống được thiết kế để hỗ trợ học tập lập trình trực tuyến với lộ trình rõ ràng, hệ thống bài giảng video chất lượng, và các công cụ quản lý học tập tiên tiến, phù hợp với xu hướng Industry 5.0.

## 🎯 Mục tiêu dự án

### Mục tiêu chính
- Xây dựng hệ thống E-learning hoàn chỉnh với đầy đủ các tính năng quản lý khóa học, bài học và người dùng.
- Tích hợp các công nghệ hiện đại để tối ưu hóa trải nghiệm người dùng (Next.js 15, Supabase, AI).
- Triển khai sản phẩm thực tế trên môi trường production.
- Đạt các tiêu chuẩn về hiệu năng, bảo mật và khả năng mở rộng.

### Mục tiêu tích hợp
- **Web E-Learning**: Hệ thống học tập trực tuyến đầy đủ tính năng
- **IoT Fingerprint Attendance**: Thiết bị điểm danh bằng vân tay thông minh
- **AI Face Recognition Attendance**: Hệ thống điểm danh bằng nhận diện khuôn mặt AI
- **Environment Monitoring**: Giám sát môi trường học tập thông minh

## 🚀 Công nghệ sử dụng

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, CSS Modules
- **State Management**: React Context, Hooks
- **UI Components**: Lucide React, Custom Components
- **Charts**: Recharts

### Backend & Database
- **Platform**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage / Cloudinary
- **API**: Next.js API Routes

### AI & Machine Learning
- **Recommendation System**: Content-based Filtering, Collaborative Filtering
- **Face Recognition**: AI-powered attendance system
- **Natural Language Processing**: Chatbot hỗ trợ học tập (dự kiến)

### IoT & Hardware
- **Fingerprint Scanner**: Thiết bị điểm danh vân tay
- **Sensors**: Cảm biến môi trường (nhiệt độ, độ ẩm, ánh sáng)
- **Microcontroller**: ESP32 / Arduino
- **Communication**: MQTT, HTTP/REST API

### Deployment
- **Domain**: [dhvlearnx.page](https://dhvlearnx.page)
- **Hosting**: Vercel / VPS

## ✨ Tính năng chính

### 👤 Người dùng (Học viên)
- **Hệ thống khóa học**: Truy cập các khóa học theo lộ trình (Frontend, Backend, Mobile, etc.).
- **Landing Page khóa học**: Trang giới thiệu chi tiết về khóa học với video giới thiệu và thông tin giảng viên.
- **Học tập tương tác**: Xem video bài giảng, đọc tài liệu Markdown, làm bài tập/quiz.
- **Theo dõi tiến độ**: Lưu trạng thái hoàn thành bài học, biểu đồ tiến độ cá nhân.
- **Ghi chú & Hỏi đáp**: Tạo ghi chú cá nhân, tham gia thảo luận và hỏi đáp.
- **Profile cá nhân**: Quản lý thông tin, xem chứng chỉ (dự kiến).
- **Điểm danh thông minh**: Điểm danh bằng vân tay hoặc nhận diện khuôn mặt AI.

### 🛠️ Quản trị viên (Admin/Teacher)
- **Dashboard thống kê**: Xem tổng quan về số lượng khóa học, bài học, người dùng và hoạt động.
- **Quản lý nội dung**:
    - Tạo/Sửa/Xóa khóa học, chương, bài học.
    - Soạn thảo nội dung bài học bằng Markdown editor chuyên nghiệp.
    - Quản lý trạng thái xuất bản (Draft/Published).
    - Upload video giới thiệu khóa học.
    - Quản lý thông tin giảng viên cho từng khóa học.
- **Quản lý người dùng**: Xem danh sách và phân quyền người dùng.
- **Quản lý điểm danh**: Xem báo cáo điểm danh từ thiết bị IoT và hệ thống AI.

## 📦 Cấu trúc dự án

```
src/
├── app/
│   ├── (main)/           # Layout chính cho người dùng
│   ├── admin/            # Giao diện quản trị
│   ├── api/              # API Routes
│   ├── auth/             # Trang đăng nhập/đăng ký
│   └── ...
├── components/           # Các component tái sử dụng
├── lib/                  # Các hàm tiện ích, cấu hình database
├── styles/               # Global styles
└── types/                # TypeScript definitions
```

## 🚀 Đề xuất phát triển

### 1. Cải thiện giao diện và trải nghiệm người dùng
- ✅ Chỉnh sửa giao diện, khoảng cách giữa các element và typography
- ✅ Xây dựng Landing Page marketing cho khóa học
- ✅ Triển khai video giới thiệu về khóa học
- ✅ Hiển thị thông tin giảng viên giảng dạy trên giao diện khóa học

### 2. Hệ thống gợi ý thông minh (AI Recommendation System)
- **Content-based Filtering**: 
    - Sử dụng TF-IDF hoặc Cosine Similarity để so sánh nội dung khóa học người dùng đã học với các khóa học khác
    - Phân tích sở thích học tập dựa trên lịch sử học tập
- **Collaborative Filtering**: 
    - Sử dụng thuật toán KNN (K-Nearest Neighbors) để tìm những người dùng có hành vi giống nhau
    - Gợi ý khóa học dựa trên hành vi của người dùng tương tự
- **Multi-step Forms**: 
    - Thu thập ý kiến ban đầu của người dùng về sở thích và mục tiêu học tập
    - Tạo kế hoạch học tập cá nhân hóa dựa trên lựa chọn của người dùng

### 3. Tích hợp Internet of Things (IoT)
- **Thiết bị điểm danh vân tay (Smart Attendance Node)**:
    - Kết nối thiết bị điểm danh vân tay với hệ thống
    - Đồng bộ dữ liệu điểm danh real-time
    - Báo cáo và thống kê điểm danh tự động
- **Giám sát môi trường học tập (Environment Monitor)**:
    - Thu thập dữ liệu nhiệt độ, độ ẩm, ánh sáng từ cảm biến
    - Phân tích và cảnh báo điều kiện môi trường không phù hợp
    - Tối ưu hóa môi trường học tập

### 4. Tính năng nâng cao
- Chatbot hỗ trợ học tập sử dụng AI
- Hệ thống chứng chỉ số (Digital Certificates)
- Tích hợp thanh toán trực tuyến
- Mobile App (React Native / Flutter)

## 🛠️ Hướng dẫn cài đặt (Local Development)

1. **Clone repository:**
    ```bash
    git clone https://github.com/huynhkhuanit/aiot-elearning-platform.git
    cd aiot-elearning-platform
    ```

2. **Cài đặt dependencies:**
    ```bash
    pnpm install
    ```

3. **Cấu hình biến môi trường:**
    Tạo file `.env.local` trong thư mục gốc và điền các thông tin cần thiết:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
    # Các biến môi trường khác...
    ```

4. **Chạy development server:**
    ```bash
    pnpm dev
    ```

5. **Truy cập:** [http://localhost:3000](http://localhost:3000)

## 📊 Kết quả đạt được

- ✅ Hệ thống E-Learning hoàn chỉnh với đầy đủ tính năng quản lý khóa học
- ✅ Giao diện người dùng hiện đại, responsive và thân thiện
- ✅ Hệ thống xác thực và phân quyền người dùng
- ✅ Quản lý nội dung học tập với Markdown editor
- ✅ Theo dõi tiến độ học tập của người dùng
- ✅ Tích hợp Supabase cho backend và database
- 🔄 Đang phát triển: Hệ thống gợi ý AI, Landing Page, IoT Integration

## 📚 Tài liệu tham khảo

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- Industry 5.0 Trends in Education

## 📝 Liên hệ

- **Sinh viên**: Huỳnh Văn Khuân
- **Email**: huynhkhuanit@gmail.com
- **GitHub**: [huynhkhuanit](https://github.com/huynhkhuanit)
- **Website**: [dhvlearnx.page](https://dhvlearnx.page)

---

© 2025 Nền tảng học tập thông minh AIoT - Đại học Hùng Vương TP. Hồ Chí Minh. All rights reserved.