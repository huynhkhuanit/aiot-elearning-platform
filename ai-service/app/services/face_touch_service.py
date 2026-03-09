"""Core face-touch frame analysis service."""

from __future__ import annotations

import base64
import math
import time
from dataclasses import dataclass
from typing import Iterable, List, Sequence

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


SENSITIVE_REGIONS = {
    "forehead": (0.28, 0.02, 0.44, 0.24),
    "left_cheek": (0.02, 0.22, 0.34, 0.68),
    "right_cheek": (0.66, 0.22, 0.98, 0.68),
    "nose": (0.36, 0.22, 0.64, 0.58),
    "mouth": (0.28, 0.55, 0.72, 0.83),
    "chin": (0.28, 0.76, 0.72, 0.98),
    "eye_zone": (0.18, 0.08, 0.82, 0.34),
}

FINGERTIP_INDICES = (4, 8, 12, 16, 20)
FINGERTIP_PRIORITY = (4, 8, 12)
FACE_BOUNDING_INDICES = (10, 152, 234, 454, 127, 356, 1, 61, 291, 199)


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
    except Exception as error:  # pragma: no cover - exact error differs by implementation
        raise FaceTouchServiceError("Không thể giải mã frame base64.") from error

    if len(raw_bytes) > settings.FACE_TOUCH_MAX_IMAGE_BYTES:
        raise FaceTouchServiceError("Kích thước frame vượt quá giới hạn cho phép.")

    image_np = np.frombuffer(raw_bytes, dtype=np.uint8)
    frame = cv2.imdecode(image_np, cv2.IMREAD_COLOR)
    if frame is None:
        raise FaceTouchServiceError("Không thể đọc frame từ ảnh đã gửi.")
    return frame


class _MediaPipeRuntime:
    def __init__(self) -> None:
        self._face_mesh = None
        self._hands = None

    def face_mesh(self):
        if self._face_mesh is None:
            self._face_mesh = mp.solutions.face_mesh.FaceMesh(
                static_image_mode=True,
                max_num_faces=1,
                refine_landmarks=True,
                min_detection_confidence=0.5,
            )
        return self._face_mesh

    def hands(self):
        if self._hands is None:
            self._hands = mp.solutions.hands.Hands(
                static_image_mode=True,
                max_num_hands=2,
                min_detection_confidence=0.5,
                min_tracking_confidence=0.5,
            )
        return self._hands


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
    if not points:
        return 0.0
    reference = max((box.width + box.height) * 0.5, 1.0)
    minimum_distance = min(_point_to_box_distance(point, box) for point in points)
    return max(0.0, 1.0 - minimum_distance / reference)


def _region_box(face_box: Box, relative_box: tuple[float, float, float, float]) -> Box:
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


def _face_landmark_subset(face_points: Sequence[Point]) -> List[Point]:
    subset = []
    for index in FACE_BOUNDING_INDICES:
        if index < len(face_points):
            subset.append(face_points[index])
    return subset or list(face_points)


def _hand_subset(hand_points: Sequence[Point]) -> List[Point]:
    subset = []
    for index in FINGERTIP_INDICES:
        if index < len(hand_points):
            subset.append(hand_points[index])
    return subset or list(hand_points)


def analyze_face_touch_frame(request: FaceTouchAnalyzeRequest) -> FaceTouchAnalyzeResponse:
    _require_dependencies()

    started_at = time.perf_counter()
    frame = _decode_image(request.image)
    height, width = frame.shape[:2]
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

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
            frameSize={"width": width, "height": height},
            overlay={"faceBox": None, "handBoxes": [], "facePoints": [], "handPoints": []},
            debug={
                "overlapScore": 0,
                "proximityScore": 0,
                "fingertipScore": 0,
            },
        )

    face_landmarks = face_results.multi_face_landmarks[0].landmark
    face_points = _landmarks_to_points(face_landmarks, width, height)
    face_box = _points_box(_face_landmark_subset(face_points))
    if face_box is None:
        raise RuntimeError("Không thể dựng face box từ landmarks.")

    expanded_face_box = _expand_box(
        face_box,
        width,
        height,
        settings.FACE_TOUCH_FACE_MARGIN_RATIO,
    )

    hand_landmark_sets = hand_results.multi_hand_landmarks or []
    hand_boxes: List[Box] = []
    hand_points_output: List[Point] = []
    regions_triggered: set[str] = set()
    overlap_scores: List[float] = []
    proximity_scores: List[float] = []
    fingertip_scores: List[float] = []

    region_boxes = {
        name: _region_box(expanded_face_box, relative_box)
        for name, relative_box in SENSITIVE_REGIONS.items()
    }

    for hand_landmarks in hand_landmark_sets[:2]:
        points = _landmarks_to_points(hand_landmarks.landmark, width, height)
        hand_points_output.extend(_hand_subset(points))

        hand_box = _points_box(points)
        if hand_box is None:
            continue
        hand_boxes.append(hand_box)

        overlap_score = _intersection_ratio(hand_box, expanded_face_box)
        fingertip_points = [points[index] for index in FINGERTIP_INDICES if index < len(points)]
        priority_points = [points[index] for index in FINGERTIP_PRIORITY if index < len(points)]
        proximity_score = _normalized_proximity(fingertip_points, expanded_face_box)

        region_scores = []
        for region_name, region_box in region_boxes.items():
            region_overlap = _intersection_ratio(hand_box, region_box)
            region_proximity = _normalized_proximity(priority_points or fingertip_points, region_box)
            region_score = max(region_overlap, region_proximity)
            region_scores.append(region_score)

            if region_overlap >= settings.FACE_TOUCH_REGION_TOUCH_THRESHOLD or region_proximity >= settings.FACE_TOUCH_REGION_NEAR_THRESHOLD:
                regions_triggered.add(region_name)

        fingertip_score = max(region_scores, default=0.0)
        overlap_scores.append(overlap_score)
        proximity_scores.append(proximity_score)
        fingertip_scores.append(fingertip_score)

    overlap_score = max(overlap_scores, default=0.0)
    proximity_score = max(proximity_scores, default=0.0)
    fingertip_score = max(fingertip_scores, default=0.0)

    raw_score = overlap_score * 0.45 + proximity_score * 0.30 + fingertip_score * 0.25
    score = max(0.0, min(raw_score, 1.0))
    state = _classify_state(score)
    alert = state == "touching_face"
    latency_ms = int((time.perf_counter() - started_at) * 1000)

    if not hand_boxes:
        note = "Đã phát hiện khuôn mặt nhưng chưa có bàn tay nào đi vào vùng phân tích."
    elif state == "touching_face":
        note = "Phát hiện tay chạm hoặc che vùng mặt nhạy cảm, nên phát cảnh báo tức thời."
    elif state == "near_face":
        note = "Có dấu hiệu tay tiến gần mặt. Hệ thống nên tiếp tục tích lũy persistence score."
    else:
        note = "Tay xuất hiện nhưng vẫn giữ khoảng cách an toàn với khuôn mặt."

    face_points_subset = _face_landmark_subset(face_points)

    return FaceTouchAnalyzeResponse(
        state=state,
        score=round(score, 4),
        alert=alert,
        regions=sorted(regions_triggered),
        hands=min(len(hand_boxes), 2),
        faceDetected=True,
        latencyMs=latency_ms,
        note=note,
        frameSize={"width": width, "height": height},
        overlay={
            "faceBox": {
                "x": round(expanded_face_box.x, 2),
                "y": round(expanded_face_box.y, 2),
                "width": round(expanded_face_box.width, 2),
                "height": round(expanded_face_box.height, 2),
            },
            "handBoxes": [
                {
                    "x": round(box.x, 2),
                    "y": round(box.y, 2),
                    "width": round(box.width, 2),
                    "height": round(box.height, 2),
                }
                for box in hand_boxes
            ],
            "facePoints": [
                {"x": round(point.x, 2), "y": round(point.y, 2)}
                for point in face_points_subset[:: max(len(face_points_subset) // 24, 1)]
            ],
            "handPoints": [
                {"x": round(point.x, 2), "y": round(point.y, 2)}
                for point in hand_points_output
            ],
        },
        debug={
            "overlapScore": round(overlap_score, 4),
            "proximityScore": round(proximity_score, 4),
            "fingertipScore": round(fingertip_score, 4),
        },
    )