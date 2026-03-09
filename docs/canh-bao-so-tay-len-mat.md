# Thiết kế và triển khai tính năng **Cảnh báo sờ tay lên mặt**

## 1. Mục tiêu tính năng

Tính năng **Cảnh báo sờ tay lên mặt** nhằm phát hiện theo thời gian thực hành vi người dùng đưa tay chạm vào các vùng trên khuôn mặt như mũi, má, miệng, cằm hoặc trán khi sử dụng webcam trong trình duyệt.

### Mục tiêu kỹ thuật
- Phát hiện được **khuôn mặt** và **bàn tay** theo thời gian thực.
- Xác định được trạng thái:
  - `safe`: tay ở xa mặt.
  - `near_face`: tay tiến gần mặt.
  - `touching_face`: tay đang chạm hoặc che phủ vùng mặt.
- Hạn chế cảnh báo sai bằng cách kết hợp:
  - hình học không gian,
  - khoảng cách giữa các landmarks,
  - độ bền theo thời gian (temporal persistence),
  - cơ chế làm mượt (smoothing / debounce).
- Tích hợp được vào web app đồ án tốt nghiệp với kiến trúc rõ ràng, dễ demo và dễ mở rộng.

---

## 2. Lựa chọn công nghệ

## 2.1. Công nghệ chính

### Frontend
- **React.js / Next.js**: xây dựng giao diện web.
- **WebRTC / getUserMedia**: lấy luồng webcam từ trình duyệt.
- **Canvas / SVG Overlay**: vẽ landmarks, vùng mặt và cảnh báo trực tiếp lên video.

### Computer Vision
- **MediaPipe Face Landmarker**:
  - phát hiện khuôn mặt,
  - trích xuất face mesh 3D,
  - hỗ trợ `IMAGE`, `VIDEO`, `LIVE_STREAM`.
- **MediaPipe Hand Landmarker**:
  - phát hiện tối đa 2 bàn tay,
  - trả về 21 landmarks mỗi tay,
  - hỗ trợ tracking giữa các frame.
- **OpenCV (backend Python, nếu cần)**:
  - đọc video,
  - xử lý frame,
  - ghi log / clip,
  - hỗ trợ pipeline kiểm thử offline.

### AI bổ trợ
- **qwen3-vl:4b (Ollama)** chỉ nên dùng ở tầng bổ trợ:
  - mô tả lại hành vi từ clip đã bị gắn cờ,
  - sinh giải thích ngữ nghĩa,
  - hỗ trợ phần trình bày AI trong báo cáo.

> Khuyến nghị: **không dùng Qwen3-VL làm detector chính** cho bài toán này. Detector chính nên là pipeline CV chuyên dụng.

---

## 3. Kiến trúc hệ thống đề xuất

## 3.1. Phương án tối ưu cho đồ án

### Phương án A - Browser-first
Toàn bộ nhận diện chạy ở frontend:
1. Trình duyệt lấy webcam.
2. Face Landmarker và Hand Landmarker chạy trực tiếp trên client.
3. Tính toán `contact_score` ngay trên frontend.
4. Hiển thị cảnh báo thời gian thực.
5. Chỉ gửi log sự kiện lên server.

**Ưu điểm**:
- phản hồi nhanh,
- giảm tải server,
- demo trực quan.

**Nhược điểm**:
- khó debug hơn backend,
- phụ thuộc hiệu năng máy client.

### Phương án B - Hybrid (khuyến nghị)
1. Frontend lấy webcam và hiển thị video.
2. Backend nhận frame hoặc clip ngắn.
3. Backend chạy MediaPipe + logic cảnh báo.
4. Backend trả về trạng thái và dữ liệu overlay.
5. Frontend hiển thị kết quả.

**Ưu điểm**:
- dễ log,
- dễ đánh giá,
- dễ viết báo cáo,
- dễ tích hợp thêm Qwen3-VL.

**Nhược điểm**:
- tăng độ trễ nếu gửi frame liên tục,
- cần thiết kế API tốt.

> Với đồ án tốt nghiệp web, nên chọn **Hybrid** nếu muốn dễ trình bày và dễ đánh giá thực nghiệm.

---

## 4. Pipeline Computer Vision chuẩn

Pipeline đề xuất:

```text
Webcam/Video Input
    -> Face Detection + Face Mesh
    -> Hand Detection + Hand Landmarks
    -> Xây dựng vùng mặt cần giám sát
    -> Tính contact score giữa tay và mặt
    -> Temporal smoothing / debounce
    -> Decision logic
    -> UI warning / logging / analytics
```

---

## 5. Các bước triển khai chi tiết

## 5.1. Bước 1 - Nhận frame từ webcam

### Frontend
- Sử dụng `navigator.mediaDevices.getUserMedia()` để lấy webcam.
- Gắn stream vào thẻ `<video>`.
- Mỗi chu kỳ render, lấy frame sang `<canvas>` để suy luận.

### Backend (nếu dùng Python)
- Dùng OpenCV `cv2.VideoCapture()` để đọc camera hoặc file video.
- Chuyển frame sang định dạng phù hợp cho MediaPipe.

---

## 5.2. Bước 2 - Phát hiện khuôn mặt

Dùng **MediaPipe Face Landmarker** để lấy:
- face mesh 3D,
- các điểm landmarks trên khuôn mặt,
- transformation matrix,
- tùy chọn blendshape scores.

### Cấu hình đề xuất
```python
num_faces = 1
min_face_detection_confidence = 0.6
min_face_presence_confidence = 0.6
min_tracking_confidence = 0.6
running_mode = LIVE_STREAM
```

### Lý do
- Bài toán mục tiêu thường chỉ có 1 người trước webcam.
- Khóa `num_faces = 1` giúp pipeline ổn định hơn.
- Sử dụng live stream để giảm chi phí xử lý frame độc lập.

---

## 5.3. Bước 3 - Phát hiện bàn tay

Dùng **MediaPipe Hand Landmarker** để lấy:
- số lượng tay,
- tay trái / tay phải,
- 21 landmarks cho mỗi tay,
- world coordinates,
- tracking qua video/live stream.

### Cấu hình đề xuất
```python
num_hands = 2
min_hand_detection_confidence = 0.6
min_hand_presence_confidence = 0.6
min_tracking_confidence = 0.6
running_mode = LIVE_STREAM
```

### Lý do
- Cần cho phép 2 tay để không bỏ sót trường hợp cả hai tay cùng đưa lên mặt.
- Tracking làm giảm việc detect lại liên tục ở mỗi frame.

---

## 5.4. Bước 4 - Dựng vùng mặt cần giám sát

Không nên chỉ dùng một bounding box chữ nhật cho toàn bộ khuôn mặt.
Thay vào đó, cần dựng các **face regions** từ mesh landmarks.

### Các vùng nên theo dõi
- `forehead`
- `left_cheek`
- `right_cheek`
- `nose`
- `mouth`
- `chin`
- `eye_zone`

### Hai lớp vùng nên có
1. **Face hull tổng**: polygon bao toàn bộ khuôn mặt.
2. **Sensitive regions**: polygon cho từng vùng nhạy cảm.

### Lý do
- Tay đi ngang trước mặt chưa chắc là chạm mặt.
- Tay chạm mũi/miệng thường là hành vi cần cảnh báo mạnh hơn.
- Tách vùng giúp phân tích hành vi chi tiết hơn trong báo cáo.

---

## 5.5. Bước 5 - Dựng vùng bàn tay

Từ 21 landmarks của mỗi tay, tạo các đặc trưng sau:
- `fingertips`: đầu ngón cái, trỏ, giữa, áp út, út.
- `palm_center`: tâm lòng bàn tay.
- `hand_hull`: đa giác bao bàn tay.
- `finger_lines`: đoạn thẳng từ khớp tới đầu ngón.

### Mục tiêu
- Xác định xem **ngón tay** đang chạm mặt,
- hay **lòng bàn tay** đang che phủ mặt,
- hay chỉ là tay đang đi gần qua vùng mặt.

---

## 5.6. Bước 6 - Tính điểm tiếp xúc (`contact_score`)

Không nên kết luận chỉ dựa trên 1 điều kiện.
Nên kết hợp nhiều tín hiệu thành một điểm số.

### Công thức tổng quát

```text
contact_score = w1 * overlap_score
              + w2 * proximity_score
              + w3 * fingertip_score
              + w4 * temporal_score
```

Trong đó:

### 1. `overlap_score`
Đo mức độ giao nhau giữa:
- `hand_hull` và `face_hull`, hoặc
- `hand_hull` và một `sensitive_region`.

Ví dụ:
```text
overlap_score = intersection_area(hand_hull, face_region) / area(face_region)
```

### 2. `proximity_score`
Đo khoảng cách từ các đầu ngón tay tới polygon vùng mặt.
Khoảng cách càng nhỏ thì điểm càng cao.

Ví dụ:
```text
proximity_score = 1 - min_distance(fingertips, face_region) / face_size
```

### 3. `fingertip_score`
Tăng điểm nếu đầu ngón tay trỏ, ngón giữa hoặc ngón cái tiến rất gần vùng mũi/miệng/má.

### 4. `temporal_score`
Tăng điểm nếu trạng thái nghi ngờ kéo dài liên tiếp nhiều frame.

---

## 5.7. Bước 7 - Ra quyết định trạng thái

Nên dùng 3 trạng thái:

### 1. `safe`
- tay ở xa mặt,
- không có overlap,
- khoảng cách lớn hơn ngưỡng.

### 2. `near_face`
- tay ở gần mặt,
- khoảng cách nhỏ,
- chưa đủ điều kiện kết luận chạm.

### 3. `touching_face`
- có overlap hoặc khoảng cách rất nhỏ,
- duy trì đủ số frame liên tiếp,
- thỏa ngưỡng `contact_score`.

### Rule mẫu
```text
if contact_score < 0.35:
    state = safe
elif 0.35 <= contact_score < 0.65:
    state = near_face
else:
    state = touching_face
```

Sau đó thêm điều kiện thời gian:
```text
- near_face nếu kéo dài >= 3 frame
- touching_face nếu kéo dài >= 6 frame
```

---

## 5.8. Bước 8 - Temporal smoothing và chống báo sai

Đây là phần rất quan trọng.

### Kỹ thuật nên dùng
- **Moving average** trên `contact_score`.
- **Median filter** cho khoảng cách đầu ngón tay.
- **Debounce** để tránh nhấp nháy trạng thái.
- **Cooldown** 1-2 giây sau mỗi lần cảnh báo.
- **Recovery window**: chỉ quay về `safe` sau vài frame liên tiếp không chạm.

### Ví dụ logic
```text
- Chỉ cảnh báo khi state = touching_face trong >= 200 ms
- Sau khi cảnh báo, khóa cảnh báo mới trong 1.5 giây
- Chỉ bỏ trạng thái touching_face nếu score thấp trong >= 5 frame liên tiếp
```

---

## 6. Kiến trúc module phần mềm

## 6.1. Module backend

### `video_capture.py`
- nhận webcam hoặc video file,
- đọc frame,
- timestamp từng frame.

### `face_detector.py`
- gọi Face Landmarker,
- trả về face landmarks,
- dựng face hull và face regions.

### `hand_detector.py`
- gọi Hand Landmarker,
- trả về hand landmarks,
- dựng hand hull và fingertips.

### `touch_logic.py`
- tính overlap,
- tính proximity,
- tính contact score,
- suy ra trạng thái.

### `smoother.py`
- moving average,
- debounce,
- cooldown.

### `alert_service.py`
- phát cảnh báo,
- ghi log sự kiện,
- lưu clip nếu cần.

### `api.py`
- REST API / WebSocket,
- gửi trạng thái và dữ liệu overlay cho frontend.

---

## 6.2. Module frontend

### `WebcamView`
- hiển thị video webcam.

### `OverlayCanvas`
- vẽ face mesh,
- vẽ hand landmarks,
- tô màu vùng cảnh báo.

### `AlertBanner`
- hiển thị trạng thái hiện tại,
- cảnh báo bằng màu / âm thanh.

### `MetricsPanel`
- số lần chạm mặt,
- vùng chạm phổ biến,
- thời lượng near-face / touching-face.

---

## 7. Pseudocode pipeline tổng quát

```python
while True:
    frame, timestamp = get_frame()

    face_result = detect_face(frame, timestamp)
    hand_result = detect_hands(frame, timestamp)

    if not face_result:
        state = "no_face"
        continue

    face_regions = build_face_regions(face_result.landmarks)
    hands = build_hand_geometry(hand_result.landmarks)

    scores = []
    for hand in hands:
        overlap_score = compute_overlap(hand.hull, face_regions)
        proximity_score = compute_proximity(hand.fingertips, face_regions)
        fingertip_score = compute_fingertip_focus(hand.fingertips, face_regions)

        raw_score = combine_scores(
            overlap_score,
            proximity_score,
            fingertip_score
        )
        scores.append(raw_score)

    frame_score = max(scores) if scores else 0
    smooth_score = temporal_smoothing(frame_score)
    state = classify_state(smooth_score)
    alert = should_alert(state)

    render_overlay(frame, face_result, hand_result, state, smooth_score)
    emit_to_frontend(state, smooth_score, alert)
```

---

## 8. API thiết kế gợi ý

## 8.1. REST API

### `POST /api/analyze-frame`
**Input**:
- ảnh frame base64 hoặc binary,
- timestamp.

**Output**:
```json
{
  "state": "near_face",
  "score": 0.58,
  "alert": false,
  "regions": ["nose", "mouth"],
  "hands": 1,
  "faceDetected": true
}
```

## 8.2. WebSocket
Dùng khi cần realtime:
- client gửi frame theo nhịp,
- server trả trạng thái gần như tức thời,
- phù hợp cho demo trực tiếp.

---

## 9. Gợi ý hiển thị trên giao diện

### Màu sắc trạng thái
- Xanh lá: `safe`
- Vàng: `near_face`
- Đỏ: `touching_face`

### Thông tin nên hiển thị
- trạng thái hiện tại,
- điểm `contact_score`,
- tay nào đang chạm mặt,
- vùng mặt nào đang bị chạm,
- bộ đếm số lần vi phạm.

### Trải nghiệm người dùng
- Không cảnh báo bằng âm thanh liên tục.
- Chỉ cảnh báo khi hành vi kéo dài đủ lâu.
- Cho phép bật/tắt âm thanh.

---

## 10. Đánh giá chất lượng hệ thống

## 10.1. Bộ dữ liệu đánh giá

Tự quay bộ video gồm các nhóm tình huống:
- tay ở xa mặt,
- tay đi ngang trước mặt,
- tay chống cằm,
- chạm mũi,
- che miệng,
- gãi má,
- nhiều góc quay,
- nhiều điều kiện ánh sáng.

## 10.2. Chỉ số đánh giá
- **Precision**: tỷ lệ cảnh báo đúng trên tổng cảnh báo.
- **Recall**: tỷ lệ phát hiện đúng trên tổng số hành vi chạm mặt thực tế.
- **F1-score**: cân bằng giữa precision và recall.
- **Latency**: độ trễ từ lúc người dùng chạm mặt đến lúc hệ thống cảnh báo.
- **False Positive Rate**: tỷ lệ báo sai.

## 10.3. Kịch bản kiểm thử
- 1 tay chạm mũi nhanh.
- 1 tay chống cằm lâu.
- 2 tay che mặt.
- tay đi ngang trước camera nhưng không chạm mặt.
- mất mặt khỏi khung hình.
- ánh sáng yếu.

---

## 11. Tối ưu hiệu năng

### Đầu vào video
- resize frame về 640x480 hoặc 720p,
- không nên đẩy độ phân giải quá cao nếu máy yếu.

### Nhịp suy luận
- không nhất thiết phải chạy ở 30 FPS đầy đủ,
- có thể suy luận ở 10-15 FPS và nội suy hiển thị.

### Tối ưu logic
- chỉ tính toán sâu khi đã detect được mặt,
- nếu không có tay thì bỏ qua bước tính overlap,
- chỉ lưu clip khi có sự kiện `touching_face`.

---

## 12. Vai trò của qwen3-vl:4b trong hệ thống

Qwen3-VL không nên làm detector chính, nhưng có thể tích hợp ở 3 tình huống:

### 1. Giải thích sự kiện
Sau khi pipeline CV phát hiện vi phạm, gửi 1 clip ngắn để model mô tả:
- người dùng đang làm gì,
- tay nào chạm mặt,
- vùng nào bị chạm.

### 2. Kiểm tra lại các trường hợp biên
Dùng với các clip mà `contact_score` nằm gần ngưỡng quyết định.

### 3. Làm phần AI cho báo cáo
- giải thích ngữ nghĩa hành vi,
- mô tả cảnh báo,
- minh họa khả năng multimodal.

---

## 13. Kế hoạch triển khai theo giai đoạn

## Giai đoạn 1 - MVP
- Hiển thị webcam.
- Detect mặt.
- Detect tay.
- Vẽ landmarks.

## Giai đoạn 2 - Core detection
- Dựng face regions.
- Tạo hand hull.
- Tính `contact_score`.
- Phân loại `safe / near_face / touching_face`.

## Giai đoạn 3 - Realtime alert
- thêm debounce,
- thêm cooldown,
- thêm âm thanh / banner cảnh báo.

## Giai đoạn 4 - Logging & analytics
- lưu số lần vi phạm,
- thống kê vùng chạm,
- biểu đồ thời gian.

## Giai đoạn 5 - AI enhancement
- tích hợp Qwen3-VL,
- sinh mô tả clip,
- giải thích hành vi cho báo cáo.

---

## 14. Rủi ro và cách giảm thiểu

### Rủi ro 1 - Báo sai khi tay đi ngang trước mặt
**Giải pháp**:
- dùng sensitive regions,
- thêm điều kiện persistence,
- thêm kiểm tra chiều sâu tương đối.

### Rủi ro 2 - Mất tracking khi ánh sáng yếu
**Giải pháp**:
- tăng độ sáng webcam,
- dùng threshold tracking phù hợp,
- thêm xử lý fallback khi confidence thấp.

### Rủi ro 3 - Độ trễ cao
**Giải pháp**:
- giảm độ phân giải frame,
- giảm FPS suy luận,
- tách pipeline UI và inference.

### Rủi ro 4 - Khó đánh giá hệ thống
**Giải pháp**:
- tự xây bộ video test,
- gắn nhãn thủ công,
- đo precision/recall/latency.

---

## 15. Kết luận kỹ thuật

Giải pháp phù hợp nhất cho tính năng **Cảnh báo sờ tay lên mặt** là:
- dùng **MediaPipe Face Landmarker** để lấy face mesh,
- dùng **MediaPipe Hand Landmarker** để lấy hand landmarks,
- dùng **logic hình học + temporal smoothing** để quyết định trạng thái,
- dùng **Qwen3-VL** như tầng giải thích AI bổ sung.

Cách làm này có các ưu điểm:
- realtime,
- dễ demo,
- dễ giải thích trong báo cáo,
- phù hợp với dự án web đồ án tốt nghiệp,
- có thể mở rộng thành hệ thống theo dõi hành vi hoặc phân tích vệ sinh cá nhân.

---

## 16. Hướng mở rộng

- phát hiện **dụi mắt**, **che miệng khi ho**, **chống cằm**, **gãi mặt**,
- phân tích tần suất chạm mặt theo phiên làm việc,
- dashboard thống kê theo ngày/tuần,
- nhắc nhở vệ sinh tay,
- tích hợp thêm nhận diện tư thế ngồi hoặc mức độ tập trung.

---

## 17. Tên file và cấu trúc khuyến nghị trong dự án

```text
project/
├── frontend/
│   ├── components/
│   │   ├── WebcamView.tsx
│   │   ├── OverlayCanvas.tsx
│   │   └── AlertBanner.tsx
│   ├── pages/
│   └── services/
├── backend/
│   ├── api.py
│   ├── video_capture.py
│   ├── face_detector.py
│   ├── hand_detector.py
│   ├── touch_logic.py
│   ├── smoother.py
│   └── alert_service.py
└── docs/
    └── canh-bao-so-tay-len-mat.md
```

---

## 18. Tóm tắt triển khai ngắn gọn

**Công thức triển khai chuẩn nhất**:
1. Webcam -> lấy frame.
2. MediaPipe Face Landmarker -> dựng face regions.
3. MediaPipe Hand Landmarker -> dựng hand hull + fingertips.
4. Tính overlap + proximity + persistence.
5. Temporal smoothing.
6. Phân loại `safe / near_face / touching_face`.
7. Phát cảnh báo và ghi log.
8. Tùy chọn gửi clip sang Qwen3-VL để mô tả ngữ nghĩa.
