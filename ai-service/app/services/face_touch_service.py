"""Core face-touch frame analysis service.

Optimized for higher FPS and more accurate detection:
- MediaPipe chạy ở video streaming mode (temporal tracking) thay vì static mode
- Downscale frame trước khi xử lý để giảm latency
- Dùng nhiều face landmarks hơn (jawline contour) cho bounding box chính xác
- Thêm knuckle + palm landmarks cho hand detection tốt hơn
- Adaptive face margin dựa trên tỉ lệ mặt/frame (xa → margin lớn hơn)
- Region-weighted scoring (eye_zone/nose nhạy hơn)
- Palm center proximity làm tín hiệu bổ sung
- Proximity normalization bằng face diagonal
"""

from __future__ import annotations

import base64
import math
import time
from dataclasses import dataclass
from typing import Iterable, List, Sequence, Tuple

import numpy as np

from app.config import settings
from app.models import FaceTouchAnalyzeRequest, FaceTouchAnalyzeResponse

try:
    import cv2
except ImportError:  # pragma: no cover - handled by runtime checks
    cv2 = None

try:
    import mediapipe as mp
except ImportError:  # pragma: no cover - handled by runtime checks
    mp = None


# --- Region definitions with sensitivity weights ---
SENSITIVE_REGIONS: dict[str, Tuple[float, float, float, float]] = {
    "forehead": (0.25, 0.00, 0.75, 0.22),
    "left_cheek": (0.00, 0.20, 0.30, 0.70),
    "right_cheek": (0.70, 0.20, 1.00, 0.70),
    "nose": (0.32, 0.20, 0.68, 0.60),
    "mouth": (0.25, 0.55, 0.75, 0.82),
    "chin": (0.25, 0.78, 0.75, 1.00),
    "eye_zone": (0.15, 0.06, 0.85, 0.32),
}

REGION_WEIGHTS: dict[str, float] = {
    "eye_zone": 1.3,
    "nose": 1.2,
    "mouth": 1.15,
    "forehead": 1.0,
    "left_cheek": 1.0,
    "right_cheek": 1.0,
    "chin": 0.85,
}

# Hand landmark indices
FINGERTIP_INDICES = (4, 8, 12, 16, 20)
FINGERTIP_PRIORITY = (4, 8, 12)
KNUCKLE_INDICES = (5, 9, 13, 17)  # MCP joints cho hand box chính xác hơn
WRIST_INDEX = 0
PALM_CENTER_INDICES = (0, 5, 9, 13, 17)  # Wrist + MCP joints → palm centroid

# Face landmarks: jawline contour + key points cho bounding box chính xác ở mọi khoảng cách
FACE_CONTOUR_INDICES = (
    10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288,
    397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136,
    172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109,
)
FACE_KEY_INDICES = (1, 4, 5, 6, 168, 195, 197, 5, 4, 1, 61, 291, 199)

# Merged set for fast lookup
_FACE_BOUNDING_SET = set(FACE_CONTOUR_INDICES) | set(FACE_KEY_INDICES)
FACE_BOUNDING_INDICES_FULL = tuple(sorted(_FACE_BOUNDING_SET))

# Overlay output: subset of contour for visualization
FACE_OVERLAY_INDICES = (10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288,
                        397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136,
                        172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109,
                        1, 61, 291, 199)


class FaceTouchServiceError(ValueError):
    """Raised when a frame request is invalid."""


@dataclass
class Box:
    x: float
    y: float
    width: float
    height: float

    @property
    def area(self) -> float:
        return max(self.width, 0) * max(self.height, 0)

    @property
    def diagonal(self) -> float:
        return math.sqrt(self.width ** 2 + self.height ** 2)

    @property
    def center(self) -> Tuple[float, float]:
        return (self.x + self.width * 0.5, self.y + self.height * 0.5)


@dataclass
class Point:
    x: float
    y: float


def _require_dependencies() -> None:
    if cv2 is None:
        raise RuntimeError("opencv-python chưa được cài đặt cho AI service.")
    if mp is None or not settings.FACE_TOUCH_ENABLE_MEDIAPIPE:
        raise RuntimeError("MediaPipe chưa sẵn sàng cho face-touch detection.")


def _strip_data_url(image_payload: str) -> str:
    if image_payload.startswith("data:"):
        parts = image_payload.split(",", 1)
        if len(parts) != 2:
            raise FaceTouchServiceError("Data URL image payload không hợp lệ.")
        return parts[1]
    return image_payload


def _decode_image(image_payload: str) -> np.ndarray:
    encoded = _strip_data_url(image_payload)
    try:
        raw_bytes = base64.b64decode(encoded, validate=True)
    except Exception as error:  # pragma: no cover
        raise FaceTouchServiceError("Không thể giải mã frame base64.") from error

    if len(raw_bytes) > settings.FACE_TOUCH_MAX_IMAGE_BYTES:
        raise FaceTouchServiceError("Kích thước frame vượt quá giới hạn cho phép.")

    image_np = np.frombuffer(raw_bytes, dtype=np.uint8)
    frame = cv2.imdecode(image_np, cv2.IMREAD_COLOR)
    if frame is None:
        raise FaceTouchServiceError("Không thể đọc frame từ ảnh đã gửi.")
    return frame


def _downscale_frame(frame: np.ndarray, max_width: int) -> Tuple[np.ndarray, float]:
    """Downscale frame nếu rộng hơn max_width. Trả về (frame, scale_factor)."""
    h, w = frame.shape[:2]
    if w <= max_width:
        return frame, 1.0
    scale = max_width / w
    new_w = max_width
    new_h = int(h * scale)
    resized = cv2.resize(frame, (new_w, new_h), interpolation=cv2.INTER_AREA)
    return resized, scale


class _MediaPipeRuntime:
    """Lazy-initialized MediaPipe models.

    Sử dụng video streaming mode (static_image_mode=False) để tận dụng
    temporal tracking giữa các frame liên tiếp → FPS cao hơn đáng kể.
    """

    def __init__(self) -> None:
        self._face_mesh = None
        self._hands = None

    def face_mesh(self):
        if self._face_mesh is None:
            self._face_mesh = mp.solutions.face_mesh.FaceMesh(
                static_image_mode=False,
                max_num_faces=1,
                refine_landmarks=True,
                min_detection_confidence=settings.FACE_TOUCH_FACE_DETECT_CONFIDENCE,
                min_tracking_confidence=settings.FACE_TOUCH_FACE_TRACK_CONFIDENCE,
            )
        return self._face_mesh

    def hands(self):
        if self._hands is None:
            self._hands = mp.solutions.hands.Hands(
                static_image_mode=False,
                max_num_hands=2,
                min_detection_confidence=settings.FACE_TOUCH_HAND_DETECT_CONFIDENCE,
                min_tracking_confidence=settings.FACE_TOUCH_HAND_TRACK_CONFIDENCE,
            )
        return self._hands

    def reset(self) -> None:
        """Reset models khi cần re-initialize."""
        if self._face_mesh is not None:
            self._face_mesh.close()
            self._face_mesh = None
        if self._hands is not None:
            self._hands.close()
            self._hands = None


_runtime = _MediaPipeRuntime()


def _landmarks_to_points(landmarks: Sequence, width: int, height: int) -> List[Point]:
    return [
        Point(x=min(max(landmark.x * width, 0), width), y=min(max(landmark.y * height, 0), height))
        for landmark in landmarks
    ]


def _points_box(points: Iterable[Point]) -> Box | None:
    point_list = list(points)
    if not point_list:
        return None
    min_x = min(point.x for point in point_list)
    max_x = max(point.x for point in point_list)
    min_y = min(point.y for point in point_list)
    max_y = max(point.y for point in point_list)
    return Box(x=min_x, y=min_y, width=max_x - min_x, height=max_y - min_y)


def _expand_box(box: Box, width: int, height: int, ratio: float) -> Box:
    margin_x = box.width * ratio
    margin_y = box.height * ratio
    x = max(box.x - margin_x, 0)
    y = max(box.y - margin_y, 0)
    max_x = min(box.x + box.width + margin_x, width)
    max_y = min(box.y + box.height + margin_y, height)
    return Box(x=x, y=y, width=max_x - x, height=max_y - y)


def _adaptive_face_margin(face_box: Box, frame_width: int, frame_height: int) -> float:
    """Tính margin ratio dựa trên tỉ lệ mặt so với frame.
    Mặt xa (nhỏ) → margin lớn hơn để bắt tay ở xa.
    Mặt gần (lớn) → margin nhỏ hơn để tránh false positive.
    """
    face_ratio = face_box.area / max(frame_width * frame_height, 1)
    base = settings.FACE_TOUCH_FACE_MARGIN_RATIO
    if face_ratio < 0.03:
        return base * 2.2
    if face_ratio < 0.08:
        return base * 1.5
    if face_ratio > 0.30:
        return base * 0.7
    return base


def _intersection_ratio(box_a: Box, box_b: Box) -> float:
    x_left = max(box_a.x, box_b.x)
    y_top = max(box_a.y, box_b.y)
    x_right = min(box_a.x + box_a.width, box_b.x + box_b.width)
    y_bottom = min(box_a.y + box_a.height, box_b.y + box_b.height)

    if x_right <= x_left or y_bottom <= y_top:
        return 0.0

    intersection = (x_right - x_left) * (y_bottom - y_top)
    denominator = max(box_b.area, 1.0)
    return min(intersection / denominator, 1.0)


def _point_to_box_distance(point: Point, box: Box) -> float:
    dx = max(box.x - point.x, 0, point.x - (box.x + box.width))
    dy = max(box.y - point.y, 0, point.y - (box.y + box.height))
    return math.sqrt(dx * dx + dy * dy)


def _normalized_proximity(points: Sequence[Point], box: Box) -> float:
    """Proximity score dùng face diagonal thay vì avg(w,h) cho chuẩn hơn."""
    if not points:
        return 0.0
    reference = max(box.diagonal, 1.0)
    minimum_distance = min(_point_to_box_distance(point, box) for point in points)
    return max(0.0, 1.0 - minimum_distance / reference)


def _palm_center(hand_points: Sequence[Point]) -> Point | None:
    """Tính tâm lòng bàn tay từ wrist + MCP joints."""
    centers = [hand_points[i] for i in PALM_CENTER_INDICES if i < len(hand_points)]
    if not centers:
        return None
    cx = sum(p.x for p in centers) / len(centers)
    cy = sum(p.y for p in centers) / len(centers)
    return Point(x=cx, y=cy)


def _palm_to_face_score(palm: Point | None, face_box: Box) -> float:
    """Score dựa trên khoảng cách tâm lòng bàn tay đến face box."""
    if palm is None:
        return 0.0
    dist = _point_to_box_distance(palm, face_box)
    reference = max(face_box.diagonal, 1.0)
    return max(0.0, 1.0 - dist / reference)


def _hand_face_area_ratio(hand_box: Box, face_box: Box) -> float:
    return hand_box.area / max(face_box.area, 1.0)


def _hand_face_size_consistency(hand_box: Box, face_box: Box) -> float:
    """Phạt trường hợp tay quá lớn so với mặt do đưa sát camera.

    Khi tay ở rất gần ống kính nhưng không ở gần mặt thật, hình chiếu 2D sẽ chồng lên mặt
    và dễ gây false positive. Tay chạm mặt thật thường không lớn hơn mặt quá nhiều.
    """
    ratio = _hand_face_area_ratio(hand_box, face_box)
    soft_limit = settings.FACE_TOUCH_HAND_FACE_RATIO_SOFT_MAX
    hard_limit = settings.FACE_TOUCH_HAND_FACE_RATIO_HARD_MAX

    if ratio <= soft_limit:
        return 1.0
    if ratio >= hard_limit:
        return 0.0

    return 1.0 - (ratio - soft_limit) / max(hard_limit - soft_limit, 1e-6)


def _region_box(face_box: Box, relative_box: Tuple[float, float, float, float]) -> Box:
    left, top, right, bottom = relative_box
    return Box(
        x=face_box.x + face_box.width * left,
        y=face_box.y + face_box.height * top,
        width=face_box.width * (right - left),
        height=face_box.height * (bottom - top),
    )


def _classify_state(score: float) -> str:
    if score >= settings.FACE_TOUCH_TOUCH_THRESHOLD:
        return "touching_face"
    if score >= settings.FACE_TOUCH_NEAR_THRESHOLD:
        return "near_face"
    return "safe"


def _clamp_score(score: float) -> float:
    return max(0.0, min(score, 1.0))


def _face_landmark_subset(face_points: Sequence[Point]) -> List[Point]:
    """Dùng full face contour + key points cho bounding box chính xác."""
    subset = []
    for index in FACE_BOUNDING_INDICES_FULL:
        if index < len(face_points):
            subset.append(face_points[index])
    return subset or list(face_points)


def _face_overlay_subset(face_points: Sequence[Point]) -> List[Point]:
    """Subset cho overlay visualization."""
    subset = []
    for index in FACE_OVERLAY_INDICES:
        if index < len(face_points):
            subset.append(face_points[index])
    return subset or list(face_points)


def _hand_subset(hand_points: Sequence[Point]) -> List[Point]:
    """Trả về fingertips + knuckles cho overlay và tính toán."""
    indices = set(FINGERTIP_INDICES) | set(KNUCKLE_INDICES) | {WRIST_INDEX}
    subset = []
    for index in sorted(indices):
        if index < len(hand_points):
            subset.append(hand_points[index])
    return subset or list(hand_points)


def _hand_bounding_points(hand_points: Sequence[Point]) -> List[Point]:
    """Dùng tất cả fingertips + knuckles + wrist cho hand box chính xác hơn."""
    indices = set(FINGERTIP_INDICES) | set(KNUCKLE_INDICES) | {WRIST_INDEX}
    return [hand_points[i] for i in sorted(indices) if i < len(hand_points)]


def analyze_face_touch_frame(request: FaceTouchAnalyzeRequest) -> FaceTouchAnalyzeResponse:
    _require_dependencies()

    started_at = time.perf_counter()
    frame = _decode_image(request.image)
    original_height, original_width = frame.shape[:2]

    # Downscale cho processing nhanh hơn
    processed_frame, scale = _downscale_frame(frame, settings.FACE_TOUCH_PROCESS_WIDTH)
    proc_h, proc_w = processed_frame.shape[:2]
    rgb_frame = cv2.cvtColor(processed_frame, cv2.COLOR_BGR2RGB)

    face_results = _runtime.face_mesh().process(rgb_frame)
    hand_results = _runtime.hands().process(rgb_frame)

    if not face_results.multi_face_landmarks:
        latency_ms = int((time.perf_counter() - started_at) * 1000)
        return FaceTouchAnalyzeResponse(
            state="safe",
            score=0,
            alert=False,
            regions=[],
            hands=0,
            faceDetected=False,
            latencyMs=latency_ms,
            note="Không phát hiện khuôn mặt trong frame hiện tại.",
            frameSize={"width": original_width, "height": original_height},
            overlay={"faceBox": None, "handBoxes": [], "facePoints": [], "handPoints": []},
            debug={
                "overlapScore": 0,
                "proximityScore": 0,
                "fingertipScore": 0,
            },
        )

    face_landmarks = face_results.multi_face_landmarks[0].landmark
    face_points = _landmarks_to_points(face_landmarks, proc_w, proc_h)
    face_box = _points_box(_face_landmark_subset(face_points))
    if face_box is None:
        raise RuntimeError("Không thể dựng face box từ landmarks.")

    # Adaptive margin: mặt xa → margin lớn, mặt gần → margin nhỏ
    margin_ratio = _adaptive_face_margin(face_box, proc_w, proc_h)
    expanded_face_box = _expand_box(face_box, proc_w, proc_h, margin_ratio)

    hand_landmark_sets = hand_results.multi_hand_landmarks or []
    hand_boxes: List[Box] = []
    hand_points_output: List[Point] = []
    regions_triggered: set[str] = set()
    overlap_scores: List[float] = []
    proximity_scores: List[float] = []
    fingertip_scores: List[float] = []
    palm_scores: List[float] = []
    near_scores: List[float] = []
    touch_scores: List[float] = []

    touch_region_boxes = {
        name: _region_box(face_box, relative_box)
        for name, relative_box in SENSITIVE_REGIONS.items()
    }
    near_region_boxes = {
        name: _region_box(expanded_face_box, relative_box)
        for name, relative_box in SENSITIVE_REGIONS.items()
    }

    for hand_landmarks in hand_landmark_sets[:2]:
        points = _landmarks_to_points(hand_landmarks.landmark, proc_w, proc_h)
        hand_points_output.extend(_hand_subset(points))

        # Dùng fingertips + knuckles + wrist cho hand box chính xác
        bounding_pts = _hand_bounding_points(points)
        hand_box = _points_box(bounding_pts) if bounding_pts else _points_box(points)
        if hand_box is None:
            continue
        hand_boxes.append(hand_box)

        touch_overlap_score = _intersection_ratio(hand_box, face_box)
        near_overlap_score = _intersection_ratio(hand_box, expanded_face_box)
        fingertip_points = [points[i] for i in FINGERTIP_INDICES if i < len(points)]
        priority_points = [points[i] for i in FINGERTIP_PRIORITY if i < len(points)]
        touch_proximity_score = _normalized_proximity(priority_points or fingertip_points, face_box)
        proximity_score = _normalized_proximity(fingertip_points, expanded_face_box)

        # Palm center proximity
        palm = _palm_center(points)
        palm_score = _palm_to_face_score(palm, expanded_face_box)
        palm_scores.append(palm_score)
        size_consistency = _hand_face_size_consistency(hand_box, face_box)

        # Region scoring: touch dùng face box thật, near dùng expanded face box
        weighted_touch_region_scores = []
        weighted_near_region_scores = []
        for region_name in SENSITIVE_REGIONS:
            touch_region_box = touch_region_boxes[region_name]
            near_region_box = near_region_boxes[region_name]
            weight = REGION_WEIGHTS.get(region_name, 1.0)
            touch_region_overlap = _intersection_ratio(hand_box, touch_region_box)
            touch_region_proximity = _normalized_proximity(
                priority_points or fingertip_points,
                touch_region_box,
            )
            near_region_overlap = _intersection_ratio(hand_box, near_region_box)
            near_region_proximity = _normalized_proximity(
                priority_points or fingertip_points,
                near_region_box,
            )

            weighted_touch_region_scores.append(
                _clamp_score(max(touch_region_overlap, touch_region_proximity) * weight)
            )
            weighted_near_region_scores.append(
                _clamp_score(max(near_region_overlap, near_region_proximity) * weight)
            )

            if (
                touch_region_overlap >= settings.FACE_TOUCH_REGION_TOUCH_THRESHOLD
                or touch_region_proximity >= settings.FACE_TOUCH_REGION_TOUCH_THRESHOLD
                or near_region_overlap >= settings.FACE_TOUCH_REGION_NEAR_THRESHOLD
                or near_region_proximity >= settings.FACE_TOUCH_REGION_NEAR_THRESHOLD
            ):
                regions_triggered.add(region_name)

        fingertip_score = _clamp_score(max(weighted_touch_region_scores, default=0.0))
        near_region_score = _clamp_score(max(weighted_near_region_scores, default=0.0))
        touch_score = _clamp_score(
            (
                touch_overlap_score * 0.45
                + touch_proximity_score * 0.20
                + fingertip_score * 0.35
            )
            * size_consistency
        )
        near_score = _clamp_score(
            (
                near_overlap_score * 0.25
                + proximity_score * 0.35
                + near_region_score * 0.25
                + palm_score * 0.15
            )
            * size_consistency
        )

        overlap_scores.append(_clamp_score(touch_overlap_score))
        proximity_scores.append(_clamp_score(proximity_score))
        fingertip_scores.append(fingertip_score)
        touch_scores.append(touch_score)
        near_scores.append(near_score)

    overlap_score = _clamp_score(max(overlap_scores, default=0.0))
    proximity_score = _clamp_score(max(proximity_scores, default=0.0))
    fingertip_score = _clamp_score(max(fingertip_scores, default=0.0))
    palm_score = _clamp_score(max(palm_scores, default=0.0))
    touch_score = _clamp_score(max(touch_scores, default=0.0))
    near_score = _clamp_score(max(near_scores, default=0.0))
    largest_hand_face_ratio = max(
        (_hand_face_area_ratio(hand_box, face_box) for hand_box in hand_boxes),
        default=0.0,
    )

    if touch_score >= settings.FACE_TOUCH_TOUCH_THRESHOLD:
        state = "touching_face"
        score = touch_score
    elif near_score >= settings.FACE_TOUCH_NEAR_THRESHOLD:
        state = "near_face"
        score = near_score
    else:
        state = "safe"
        score = max(near_score, touch_score)

    alert = state == "touching_face"
    latency_ms = int((time.perf_counter() - started_at) * 1000)

    if not hand_boxes:
        note = "Đã phát hiện khuôn mặt nhưng chưa có bàn tay nào đi vào vùng phân tích."
    elif state == "touching_face":
        note = "Phát hiện tay chạm hoặc che vùng mặt nhạy cảm, nên phát cảnh báo tức thời."
    elif state == "near_face":
        note = "Có dấu hiệu tay tiến gần mặt. Hệ thống nên tiếp tục tích lũy persistence score."
    elif largest_hand_face_ratio > settings.FACE_TOUCH_HAND_FACE_RATIO_SOFT_MAX:
        note = "Phát hiện tay ở rất gần camera nhưng chưa đủ bằng chứng để kết luận là chạm mặt."
    else:
        note = "Tay xuất hiện nhưng vẫn giữ khoảng cách an toàn với khuôn mặt."

    face_overlay_pts = _face_overlay_subset(face_points)

    # Scale tọa độ về kích thước frame gốc cho overlay
    inv_scale = 1.0 / scale if scale != 1.0 else 1.0

    return FaceTouchAnalyzeResponse(
        state=state,
        score=round(score, 4),
        alert=alert,
        regions=sorted(regions_triggered),
        hands=min(len(hand_boxes), 2),
        faceDetected=True,
        latencyMs=latency_ms,
        note=note,
        frameSize={"width": original_width, "height": original_height},
        overlay={
            "faceBox": {
                "x": round(face_box.x * inv_scale, 2),
                "y": round(face_box.y * inv_scale, 2),
                "width": round(face_box.width * inv_scale, 2),
                "height": round(face_box.height * inv_scale, 2),
            },
            "handBoxes": [
                {
                    "x": round(box.x * inv_scale, 2),
                    "y": round(box.y * inv_scale, 2),
                    "width": round(box.width * inv_scale, 2),
                    "height": round(box.height * inv_scale, 2),
                }
                for box in hand_boxes
            ],
            "facePoints": [
                {"x": round(pt.x * inv_scale, 2), "y": round(pt.y * inv_scale, 2)}
                for pt in face_overlay_pts
            ],
            "handPoints": [
                {"x": round(pt.x * inv_scale, 2), "y": round(pt.y * inv_scale, 2)}
                for pt in hand_points_output
            ],
        },
        debug={
            "overlapScore": round(_clamp_score(overlap_score), 4),
            "proximityScore": round(_clamp_score(proximity_score), 4),
            "fingertipScore": round(_clamp_score(fingertip_score), 4),
        },
    )