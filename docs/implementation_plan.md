# Refactor FaceTouchAlertTool — UI Đơn Giản Hóa

Refactor giao diện từ **1600 dòng monolith** phức tạp (hero section, 3 tabs, terminal logs, 4 score cards) sang **Single-Panel Focus** — đơn giản, hiệu quả, camera là trung tâm.

## Phạm vi thay đổi

- **Chỉ refactor UI layer** — toàn bộ business logic (camera, detection, audio, service health) giữ nguyên 100%
- **Tách file** cho maintainability — không thay đổi behavior
- **Không thay đổi** API route, page route, hay bất kỳ file ngoài folder `face-touch-alert/`

---

## Proposed Changes

### Component Structure — File Decomposition

Tách 1 file 1600 dòng thành 3 file có trách nhiệm rõ ràng:

```
src/components/tools/face-touch-alert/
├── types.ts                    [NEW]  ~90 dòng — Type definitions
├── use-face-touch-detection.ts [NEW]  ~350 dòng — Custom hook (toàn bộ logic)
└── FaceTouchAlertTool.tsx      [MODIFY] ~350 dòng — Pure UI (giảm ~75%)
```

---

#### [NEW] [types.ts](file:///e:/DHV/school_year_4/semester_2/DoAnTotNghiep/src/aiot_learning_platform/src/components/tools/face-touch-alert/types.ts)

Chứa tất cả type definitions hiện đang nằm trong FaceTouchAlertTool.tsx:

- `DetectorState`, `FaceRegion`, `OverlayBox`, `OverlayPoint`, `FrameOverlay`
- `DetectionResponse`, `ServiceState`, `ServiceHealthResponse`
- `defaultDetection` constant
- Utility functions: `clampScore`, `formatPercent`

---

#### [NEW] [use-face-touch-detection.ts](file:///e:/DHV/school_year_4/semester_2/DoAnTotNghiep/src/aiot_learning_platform/src/components/tools/face-touch-alert/use-face-touch-detection.ts)

Custom hook `useFaceTouchDetection()` đóng gói **toàn bộ** business logic:

**Di chuyển vào hook (giữ nguyên logic, không sửa):**
- Tất cả `useRef` declarations (video, overlay, capture canvas, stream, animation frame, etc.)
- Tất cả `useState` declarations
- `syncOverlayCanvasSize()`, `isServiceAvailabilityError()`, `addLog()`
- `checkServiceHealth()`, `playAlertTone()`
- `startCamera()`, `stopCamera()`
- `analyzeCurrentFrame()`
- `drawOverlay()`, `projectOverlayPoint()`, `projectOverlayBox()`
- `getCameraAccessErrorMessage()`
- Tất cả `useEffect` blocks (overlay draw, resize observer, animation frame loop, mount/cleanup)

**Hook return interface:**
```typescript
interface UseFaceTouchDetectionReturn {
  // Refs for DOM elements
  videoRef: RefObject<HTMLVideoElement | null>;
  overlayRef: RefObject<HTMLCanvasElement | null>;
  captureCanvasRef: RefObject<HTMLCanvasElement | null>;

  // State
  cameraActive: boolean;
  audioEnabled: boolean;
  detectorState: DetectorState;
  serviceState: ServiceState;
  detection: DetectionResponse;
  displayScore: number;
  alertCount: number;
  sampleRate: number[];
  cameraError: string | null;
  serviceStatus: string;

  // Actions
  startCamera: () => void;
  stopCamera: () => void;
  toggleCamera: () => void;
  setAudioEnabled: (value: boolean | ((prev: boolean) => boolean)) => void;
  setSampleRate: (value: number[]) => void;
  checkServiceHealth: () => void;
  resetCounters: () => void;
}
```

---

#### [MODIFY] [FaceTouchAlertTool.tsx](file:///e:/DHV/school_year_4/semester_2/DoAnTotNghiep/src/aiot_learning_platform/src/components/tools/face-touch-alert/FaceTouchAlertTool.tsx)

**Giảm từ ~1600 dòng → ~350 dòng.** Chỉ chứa pure UI.

---

### UI Layout — Single-Panel Focus

#### Cấu trúc mới (từ trên xuống dưới):

```
┌─────────────────────────────────────────────┐
│  Header Bar (compact)                       │
│  ┌─────┐                                    │
│  │ 👁  │ Face Touch Alert   [🔊] [⚙️]      │
│  └─────┘                                    │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │                                     │    │
│  │          CAMERA FEED                │    │
│  │          + detection overlay        │    │
│  │                                     │    │
│  │                      [● An toàn]    │    │ ← Status badge on video
│  └─────────────────────────────────────┘    │
│                                             │
│  Contact Score  ████████░░░░░░░░░░  32%     │ ← Single progress bar
│                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │ 🖐 0     │ │ 👤 Yes   │ │ ⏱ 45ms  │    │ ← 3 compact metrics
│  │ Hands    │ │ Face     │ │ Latency  │    │
│  └──────────┘ └──────────┘ └──────────┘    │
│                                             │
│  ┌──────────────────────────────────────┐   │
│  │  🚨 Cảnh báo chạm mặt: 3 lần       │   │ ← Alert counter (inline)
│  └──────────────────────────────────────┘   │
│                                             │
│         [ ▶ Bật Camera ]                    │ ← Primary action
│                                             │
│  ⚠️ Service offline... (contextual)         │ ← Only when needed
└─────────────────────────────────────────────┘
```

---

### Chi tiết từng phần UI

#### 1. Header Bar
- **Giữ**: Icon + tên tool + audio toggle (icon button) 
- **Bỏ**: Badge "AI Vision Realtime Tool", nút Start/Stop ở header (chuyển xuống dưới camera)
- **Thêm**: Settings popover nhỏ cho FPS slider (ẩn theo mặc định)
- Height: ~56px, `sticky top-0`

#### 2. Camera Feed (Trung tâm — chiếm ~60% viewport)
- **Giữ nguyên**: `<video>` + `<canvas>` overlay + `<canvas>` capture (hidden)
- **Giữ**: Status badge overlay (góc phải trên video) với dot + label
- **Bỏ**: Mini metrics grid dưới video (hands/face/latency → chuyển ra ngoài)
- **Bỏ**: Contact score bar dưới video → chuyển ra thành element riêng
- **Khi camera tắt**: Placeholder đơn giản với icon camera + text nhỏ
- Border: `border border-slate-700/50 rounded-xl` — nhẹ nhàng, không glow

#### 3. Contact Score Bar
- **1 thanh duy nhất** bên ngoài camera area
- Đổi màu theo state: xanh (safe) → vàng (near) → đỏ (touching)
- Text: "Contact Score" bên trái, "32%" bên phải

#### 4. Metrics Row (3 compact cards inline)
- **Hands**: số tay detected
- **Face**: có/không (✓ / ✗)
- **Latency**: ms
- Style: `bg-slate-800/50 rounded-lg p-3`, text nhỏ, compact

#### 5. Alert Counter
- **1 dòng inline**, không phải panel lớn
- Khi 0: ẩn hoặc mờ
- Khi > 0: hiện rõ với icon cảnh báo, text đỏ nhẹ
- Format: "🚨 Cảnh báo chạm mặt: **3** lần trong phiên này"

#### 6. Primary Action Button
- **1 nút lớn duy nhất** ở dưới: "Bật Camera" / "Dừng Camera"
- Full width, rounded, prominent
- Khi camera active: variant destructive nhẹ
- Khi camera off: variant primary

#### 7. Contextual Messages (chỉ khi cần)
- **Service offline**: Warning banner nhỏ, inline
- **Camera error**: Error banner nhỏ, inline
- **Bình thường**: Không hiện gì — clean

---

### Những gì BỎ HOÀN TOÀN

| Phần | Dòng hiện tại | Lý do bỏ |
|---|---|---|
| Hero section (h1 + description + 3 status cards) | ~130 dòng JSX | Marketing copy, không phải tool UI |
| `pipelineSteps` data + Pipeline tab | ~70 dòng | Nội dung thesis, user không cần |
| `evaluationRows` + `riskRows` data + Evaluation tab | ~60 dòng | Nội dung thesis |
| `statusCards` array | ~20 dòng | Marketing cards |
| Tabs system (`<Tabs>`, `<TabsList>`, 3x `<TabsTrigger>`) | ~30 dòng | Không còn tabs |
| System Logs terminal | ~50 dòng JSX | Developer debugging |
| `logEntries` state + `addLog()` | ~10 dòng | Không cần hiện log |
| 4x `<CircleScoreCard>` + component definition | ~80 dòng | Quá chi tiết cho user |
| Service notes panel (full panel) | ~80 dòng | Thay bằng inline message |
| Control bar (camera switch + audio switch) | ~70 dòng | Thay bằng icon buttons + 1 primary button |
| **Tổng bỏ** | **~600 dòng JSX** | |

> [!NOTE]
> `addLog()` và `logEntries` vẫn giữ trong hook nhưng không render ra UI. Có thể dùng `console.log` thay thế nếu cần debug, hoặc giữ cho mục đích mở rộng sau này.

---

### Style Guidelines

| Aspect | Hiện tại | Sau refactor |
|---|---|---|
| Background | `bg-[#07111f]` (rất tối) | `bg-slate-950` hoặc `bg-[#0a0f1a]` — vẫn dark nhưng nhẹ hơn |
| Accent color | `#13b6ec` (cyan) | Giữ nguyên `#13b6ec` — đã quen thuộc |
| Border | Nhiều neon glow, glassmorphism | `border-slate-800` — flat, minimal |
| Typography | Space Grotesk, nhiều size khác nhau | Giữ font, giảm số variant (chỉ sm, base, lg) |
| Spacing | Nhiều padding lớn (py-12, px-24) | Compact hơn (py-4, px-6), max-width hẹp hơn |
| Effects | `backdrop-blur-md`, `shadow-2xl`, ring glow | Bỏ blur, shadow tối thiểu, không glow |
| Responsive | Full page layout phức tạp | Single column, max-w-2xl, centered |

---

## Verification Plan

### Build Check
```bash
pnpm build
```
Đảm bảo không có TypeScript errors sau khi tách file.

### Visual Verification
- Mở browser tại `/tools/face-touch-alert`
- Kiểm tra: Camera bật/tắt hoạt động bình thường
- Kiểm tra: Status badge đổi màu theo state
- Kiểm tra: Contact score bar animate mượt
- Kiểm tra: Alert counter tăng khi phát hiện chạm mặt
- Kiểm tra: Service offline banner hiện đúng khi service tắt
- Kiểm tra: Responsive trên mobile viewport

### Functional Regression
- Camera start/stop: Giữ nguyên behavior
- Audio alert: Vẫn phát tiếng khi `touching_face`
- Detection overlay: Canvas vẫn vẽ face/hand boxes
- Service health check: Tự động retry khi offline
- FPS control: Vẫn hoạt động qua settings popover
- Reset counters: Vẫn hoạt động

---

## Execution Order

| Step | Task | Files |
|---|---|---|
| 1 | Tạo `types.ts` — extract types + constants | [NEW] types.ts |
| 2 | Tạo `use-face-touch-detection.ts` — extract hook | [NEW] use-face-touch-detection.ts |
| 3 | Rewrite `FaceTouchAlertTool.tsx` — new UI layout | [MODIFY] FaceTouchAlertTool.tsx |
| 4 | Build check + visual verification | — |
