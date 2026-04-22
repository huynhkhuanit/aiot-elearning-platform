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
# All joints that can make contact with face (fingertips + DIP + PIP + MCP)
ALL_CONTACT_INDICES = (
    4, 8, 12, 16, 20,   # fingertips
    3, 7, 11, 15, 19,   # DIP joints
    2, 6, 10, 14, 18,   # PIP joints
    5, 9, 13, 17,        # MCP/knuckle joints
)

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
    z: float = 0.0


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
        self._face_mesh_static = None
        self._face_detection = None
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

    def face_mesh_static(self):
        if self._face_mesh_static is None:
            self._face_mesh_static = mp.solutions.face_mesh.FaceMesh(
                static_image_mode=True,
                max_num_faces=1,
                refine_landmarks=True,
                min_detection_confidence=settings.FACE_TOUCH_FACE_DETECT_CONFIDENCE,
            )
        return self._face_mesh_static

    def face_detection(self):
        if self._face_detection is None:
            self._face_detection = mp.solutions.face_detection.FaceDetection(
                model_selection=1,
                min_detection_confidence=max(
                    settings.FACE_TOUCH_FACE_DETECT_CONFIDENCE - 0.15,
                    0.35,
                ),
            )
        return self._face_detection

    def reset(self) -> None:
        """Reset models khi cần re-initialize."""
        if self._face_mesh is not None:
            self._face_mesh.close()
            self._face_mesh = None
        if self._face_mesh_static is not None:
            self._face_mesh_static.close()
            self._face_mesh_static = None
        if self._face_detection is not None:
            self._face_detection.close()
            self._face_detection = None
        if self._hands is not None:
            self._hands.close()
            self._hands = None


_runtime = _MediaPipeRuntime()
_face_cascade = None


def _landmarks_to_points(landmarks: Sequence, width: int, height: int) -> List[Point]:
    return [
        Point(
            x=min(max(landmark.x * width, 0), width),
            y=min(max(landmark.y * height, 0), height),
            z=float(getattr(landmark, "z", 0.0)),
        )
        for landmark in landmarks
    ]


def _roi_landmarks_to_points(landmarks: Sequence, crop_box: Box) -> List[Point]:
    return [
        Point(
            x=min(max(crop_box.x + landmark.x * crop_box.width, 0), crop_box.x + crop_box.width),
            y=min(max(crop_box.y + landmark.y * crop_box.height, 0), crop_box.y + crop_box.height),
            z=float(getattr(landmark, "z", 0.0)),
        )
        for landmark in landmarks
    ]


def _relative_box_to_box(relative_box, width: int, height: int) -> Box | None:
    x = max(float(relative_box.xmin) * width, 0.0)
    y = max(float(relative_box.ymin) * height, 0.0)
    max_x = min(float(relative_box.xmin + relative_box.width) * width, float(width))
    max_y = min(float(relative_box.ymin + relative_box.height) * height, float(height))
    if max_x <= x or max_y <= y:
        return None
    return Box(x=x, y=y, width=max_x - x, height=max_y - y)


def _box_bounds(box: Box, width: int, height: int) -> Tuple[int, int, int, int]:
    left = max(int(math.floor(box.x)), 0)
    top = max(int(math.floor(box.y)), 0)
    right = min(int(math.ceil(box.x + box.width)), width)
    bottom = min(int(math.ceil(box.y + box.height)), height)
    return left, top, right, bottom


def _opencv_face_cascade():
    global _face_cascade

    if _face_cascade is not None:
        return _face_cascade

    cascade_root = getattr(getattr(cv2, "data", None), "haarcascades", None)
    if not cascade_root:
        return None

    cascade = cv2.CascadeClassifier(
        f"{cascade_root}haarcascade_frontalface_default.xml",
    )
    if cascade.empty():
        return None

    _face_cascade = cascade
    return _face_cascade


def _opencv_face_box(frame: np.ndarray) -> Box | None:
    cascade = _opencv_face_cascade()
    if cascade is None:
        return None

    gray_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    min_edge = max(24, int(round(min(frame.shape[:2]) * 0.05)))
    detections = cascade.detectMultiScale(
        gray_frame,
        scaleFactor=1.05,
        minNeighbors=3,
        minSize=(min_edge, min_edge),
    )
    if len(detections) == 0:
        return None

    x, y, width, height = max(detections, key=lambda item: item[2] * item[3])
    return Box(
        x=float(x),
        y=float(y),
        width=float(width),
        height=float(height),
    )


def _prepare_face_roi(frame: np.ndarray, face_box: Box) -> Tuple[np.ndarray, Box] | None:
    frame_height, frame_width = frame.shape[:2]
    roi_box = _expand_box(
        face_box,
        frame_width,
        frame_height,
        max(
            settings.FACE_TOUCH_FACE_ROI_MARGIN_RATIO,
            _adaptive_face_margin(face_box, frame_width, frame_height),
        ),
    )
    left, top, right, bottom = _box_bounds(roi_box, frame_width, frame_height)
    if right <= left or bottom <= top:
        return None

    roi_frame = frame[top:bottom, left:right]
    if roi_frame.size == 0:
        return None

    crop_box = Box(
        x=float(left),
        y=float(top),
        width=float(right - left),
        height=float(bottom - top),
    )
    longest_edge = max(roi_frame.shape[0], roi_frame.shape[1])
    min_size = settings.FACE_TOUCH_FACE_ROI_MIN_SIZE
    if longest_edge < min_size:
        scale = min_size / max(longest_edge, 1)
        roi_frame = cv2.resize(
            roi_frame,
            (
                max(1, int(round(roi_frame.shape[1] * scale))),
                max(1, int(round(roi_frame.shape[0] * scale))),
            ),
            interpolation=cv2.INTER_CUBIC,
        )

    return roi_frame, crop_box


def _approximate_face_points(face_box: Box) -> List[Point]:
    points: List[Point] = []
    center_x, center_y = face_box.center
    radius_x = max(face_box.width * 0.5, 1.0)
    radius_y = max(face_box.height * 0.5, 1.0)
    count = max(len(FACE_OVERLAY_INDICES), 24)

    for index in range(count):
        angle = (2 * math.pi * index / count) - (math.pi / 2)
        points.append(
            Point(
                x=center_x + math.cos(angle) * radius_x,
                y=center_y + math.sin(angle) * radius_y,
            )
        )

    return points


def _fallback_face_points(processed_frame: np.ndarray, rgb_frame: np.ndarray) -> Tuple[List[Point], Box] | None:
    proc_h, proc_w = processed_frame.shape[:2]
    detection_results = _runtime.face_detection().process(rgb_frame)
    detections = detection_results.detections or []
    best_face_box = None
    best_score = -1.0

    for detection in detections:
        relative_box = getattr(getattr(detection, "location_data", None), "relative_bounding_box", None)
        if relative_box is None:
            continue
        face_box = _relative_box_to_box(relative_box, proc_w, proc_h)
        if face_box is None:
            continue
        score = float(detection.score[0]) if getattr(detection, "score", None) else 0.0
        if score > best_score:
            best_face_box = face_box
            best_score = score

    if best_face_box is None:
        best_face_box = _opencv_face_box(processed_frame)
    if best_face_box is None:
        return None

    roi = _prepare_face_roi(processed_frame, best_face_box)
    if roi is not None:
        roi_frame, crop_box = roi
        roi_rgb = cv2.cvtColor(roi_frame, cv2.COLOR_BGR2RGB)
        roi_results = _runtime.face_mesh_static().process(roi_rgb)
        if roi_results.multi_face_landmarks:
            roi_points = _roi_landmarks_to_points(
                roi_results.multi_face_landmarks[0].landmark,
                crop_box,
            )
            face_box = _points_box(_face_landmark_subset(roi_points))
            if face_box is not None:
                return roi_points, face_box

    return _approximate_face_points(best_face_box), best_face_box


def _extract_face_points(processed_frame: np.ndarray, rgb_frame: np.ndarray) -> Tuple[List[Point], Box] | None:
    proc_h, proc_w = processed_frame.shape[:2]
    face_results = _runtime.face_mesh().process(rgb_frame)
    if face_results.multi_face_landmarks:
        face_landmarks = face_results.multi_face_landmarks[0].landmark
        face_points = _landmarks_to_points(face_landmarks, proc_w, proc_h)
        face_box = _points_box(_face_landmark_subset(face_points))
        if face_box is not None:
            return face_points, face_box

    return _fallback_face_points(processed_frame, rgb_frame)


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


def _face_points_occluded_by_hand(face_points: Sequence[Point], hand_box: Box) -> float:
    """Tỉ lệ face contour points nằm trong hand bounding box.

    Khi tay ở TRƯỚC mặt (giữa camera và mặt), phần lớn face landmarks
    bị hand box bao phủ (>40%). Khi chạm mặt thật từ bên cạnh, chỉ có
    một phần nhỏ face landmarks nằm trong hand box (<30%).
    """
    if not face_points:
        return 0.0
    inside = sum(
        1 for p in face_points
        if (hand_box.x <= p.x <= hand_box.x + hand_box.width
            and hand_box.y <= p.y <= hand_box.y + hand_box.height)
    )
    return inside / len(face_points)


def _fingertip_contact_score(
    hand_points: Sequence[Point],
    face_points: Sequence[Point],
    face_box: Box,
) -> float:
    """Kiểm tra xem bất kỳ điểm nào trên bàn tay có chạm vào gần khuôn mặt không.

    Kiểm tra tất cả các đốt ngón tay (fingertip, DIP, PIP, MCP) thay vì chỉ đầu
    ngón tay. Khi úp tay vào cằm/má, các đốt giữa là điểm gần mặt nhất.
    Dùng toàn bộ 468 face landmarks để phát hiện tiếp xúc ở bất kỳ vùng nào.
    Trả về score 0-1: 1.0 nếu có điểm tay sát mặt, 0.0 nếu xa.
    """
    if not hand_points or not face_points:
        return 0.0

    contact_joints = [hand_points[i] for i in ALL_CONTACT_INDICES if i < len(hand_points)]
    if not contact_joints:
        return 0.0

    contact_dist = face_box.diagonal * settings.FACE_TOUCH_CONTACT_RATIO
    soft_dist = contact_dist * settings.FACE_TOUCH_CONTACT_SOFT_MULT

    face_xs = [fp.x for fp in face_points]
    face_ys = [fp.y for fp in face_points]

    best_score = 0.0
    for joint in contact_joints:
        min_d_sq = float("inf")
        jx, jy = joint.x, joint.y
        for fx, fy in zip(face_xs, face_ys):
            d_sq = (jx - fx) ** 2 + (jy - fy) ** 2
            if d_sq < min_d_sq:
                min_d_sq = d_sq
        min_d = math.sqrt(min_d_sq)

        if min_d <= contact_dist:
            return 1.0
        if min_d <= soft_dist:
            s = 1.0 - (min_d - contact_dist) / (soft_dist - contact_dist)
            if s > best_score:
                best_score = s

    return best_score


def _in_front_of_face_penalty(occlusion_ratio: float, hand_box: Box, face_box: Box) -> float:
    """Penalty multiplier khi tay đang ở trước mặt thay vì chạm mặt.

    Kết hợp occlusion ratio (bao nhiêu face points bị hand box che) và
    mức độ hand center trùng với face center để phát hiện tay đặt trước mặt.
    """
    low = settings.FACE_TOUCH_OCCLUSION_LOW
    high = settings.FACE_TOUCH_OCCLUSION_HIGH

    if occlusion_ratio <= low:
        return 1.0

    # Tay càng trùng tâm mặt → càng có khả năng tay ở trước mặt
    hand_cx, hand_cy = hand_box.center
    face_cx, face_cy = face_box.center
    dx = abs(hand_cx - face_cx) / max(face_box.width, 1)
    dy = abs(hand_cy - face_cy) / max(face_box.height, 1)
    center_alignment = max(0.0, 1.0 - math.sqrt(dx * dx + dy * dy))

    if occlusion_ratio >= high:
        occlusion_t = 1.0
    else:
        occlusion_t = (occlusion_ratio - low) / max(high - low, 1e-6)

    # center_alignment tăng cường penalty; floor 0.25 để vẫn phạt dù lệch tâm
    penalty_strength = occlusion_t * max(center_alignment, 0.25) * 0.92
    return max(0.08, 1.0 - penalty_strength)


def _hand_in_front_confidence(
    hand_box: Box,
    face_box: Box,
    face_points: Sequence[Point],
) -> float:
    """Ước lượng xác suất tay đang ở TRƯỚC mặt thay vì chạm mặt.

    Khi tay ở trước mặt (giữa camera và mặt):
    - Tâm mặt nằm bên trong hand box
    - Hand box phủ phần lớn face box
    - Che đều cả hai bên trái/phải khuôn mặt (đối xứng)
    - Tâm hand gần tâm face

    Khi tay chạm mặt từ bên cạnh:
    - Chỉ che một bên mặt (không đối xứng)
    - Tâm hand lệch xa tâm face

    Returns 0.0–1.0 (cao = rất có khả năng tay ở trước mặt).
    """
    face_cx, face_cy = face_box.center

    # Signal 1: Tâm mặt nằm trong hand box
    face_center_inside = (
        hand_box.x <= face_cx <= hand_box.x + hand_box.width
        and hand_box.y <= face_cy <= hand_box.y + hand_box.height
    )

    # Signal 2: Tỉ lệ face box bị hand box phủ
    ix_left = max(hand_box.x, face_box.x)
    iy_top = max(hand_box.y, face_box.y)
    ix_right = min(hand_box.x + hand_box.width, face_box.x + face_box.width)
    iy_bottom = min(hand_box.y + hand_box.height, face_box.y + face_box.height)
    if ix_right > ix_left and iy_bottom > iy_top:
        face_coverage = ((ix_right - ix_left) * (iy_bottom - iy_top)
                         / max(face_box.area, 1.0))
    else:
        face_coverage = 0.0

    # Signal 3: Đối xứng — hand che cả hai bên mặt đều nhau
    left_occ = 0
    right_occ = 0
    left_total = 0
    right_total = 0
    for p in face_points:
        inside = (hand_box.x <= p.x <= hand_box.x + hand_box.width
                  and hand_box.y <= p.y <= hand_box.y + hand_box.height)
        if p.x < face_cx:
            left_total += 1
            if inside:
                left_occ += 1
        else:
            right_total += 1
            if inside:
                right_occ += 1

    left_ratio = left_occ / max(left_total, 1)
    right_ratio = right_occ / max(right_total, 1)

    # Symmetry cao khi CẢ HAI bên đều bị che đáng kể
    if left_ratio > 0.15 and right_ratio > 0.15:
        symmetry = min(left_ratio, right_ratio) / max(left_ratio, right_ratio, 1e-6)
    else:
        symmetry = 0.0

    # Signal 4: Tâm hand gần tâm face
    dx = abs(hand_box.center[0] - face_cx) / max(face_box.width, 1)
    dy = abs(hand_box.center[1] - face_cy) / max(face_box.height, 1)
    center_alignment = max(0.0, 1.0 - math.sqrt(dx * dx + dy * dy))

    confidence = 0.0
    if face_center_inside:
        confidence += 0.25
    confidence += min(face_coverage, 1.0) * 0.25
    confidence += symmetry * 0.30
    confidence += center_alignment * 0.20

    return _clamp_score(confidence)


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


def get_face_touch_runtime_status() -> dict[str, object]:
    try:
        _require_dependencies()
        _runtime.face_mesh()
        _runtime.face_mesh_static()
        _runtime.face_detection()
        _runtime.hands()
    except Exception as error:
        return {
            "available": False,
            "message": str(error),
        }

    return {
        "available": True,
        "message": "Face-touch runtime is ready.",
    }


def analyze_face_touch_frame(request: FaceTouchAnalyzeRequest) -> FaceTouchAnalyzeResponse:
    _require_dependencies()

    started_at = time.perf_counter()
    frame = _decode_image(request.image)
    original_height, original_width = frame.shape[:2]

    # Downscale cho processing nhanh hơn
    processed_frame, scale = _downscale_frame(frame, settings.FACE_TOUCH_PROCESS_WIDTH)
    proc_h, proc_w = processed_frame.shape[:2]
    rgb_frame = cv2.cvtColor(processed_frame, cv2.COLOR_BGR2RGB)

    hand_results = _runtime.hands().process(rgb_frame)
    face_data = _extract_face_points(processed_frame, rgb_frame)

    if face_data is None:
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

    face_points, face_box = face_data

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

    face_overlay_pts = _face_overlay_subset(face_points)

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
        occlusion = _face_points_occluded_by_hand(face_overlay_pts, hand_box)
        occlusion_penalty = _in_front_of_face_penalty(occlusion, hand_box, face_box)
        contact = _fingertip_contact_score(points, face_points, face_box)

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
        base_touch = (
            touch_overlap_score * 0.45
            + touch_proximity_score * 0.20
            + fingertip_score * 0.35
        )
        # Phân tích xem tay có đang ở TRƯỚC mặt thay vì chạm mặt không
        in_front = _hand_in_front_confidence(hand_box, face_box, face_overlay_pts)

        # Bypass penalty CHỈ khi: contact cao + tay kích thước hợp lý
        # + occlusion thấp + KHÔNG có dấu hiệu tay ở trước mặt
        if (contact >= 0.5 and size_consistency >= 0.5
                and occlusion < 0.40 and in_front < 0.35):
            effective_penalty = max(occlusion_penalty, 0.85)
        elif in_front >= 0.35:
            # Tay có khả năng ở trước mặt → phạt mạnh hơn tỉ lệ với confidence
            front_penalty = max(0.08, 1.0 - in_front * 1.1)
            effective_penalty = min(occlusion_penalty, front_penalty)
        else:
            effective_penalty = occlusion_penalty
        touch_score = _clamp_score(
            max(contact * 0.88, base_touch)
            * size_consistency
            * effective_penalty
        )
        near_score = _clamp_score(
            (
                near_overlap_score * 0.25
                + proximity_score * 0.35
                + near_region_score * 0.25
                + palm_score * 0.15
            )
            * max(size_consistency, 0.55)
            * max(occlusion_penalty, 0.25)
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
    # Tính in_front tổng hợp cho debug output
    in_front_max = 0.0
    for hb in hand_boxes:
        in_front_max = max(in_front_max,
                          _hand_in_front_confidence(hb, face_box, face_overlay_pts))
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
            "inFrontScore": round(_clamp_score(in_front_max), 4),
        },
    )
