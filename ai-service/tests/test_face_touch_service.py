import base64
import pathlib
import sys

import cv2
import numpy as np

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))

from app.models import FaceTouchAnalyzeRequest
from app.services.face_touch_service import (
    ALL_CONTACT_INDICES,
    Box,
    Point,
    _hand_depth_assessment,
    analyze_face_touch_frame,
)


LENA_FIXTURE_B64 = (
    "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAoHBwgHBgoICAgLCgoLDhgQDg0NDh0VFhEYIx8lJCIfIiEmKzcvJik0KSEiMEEx"
    "NDk7Pj4+JS5ESUM8SDc9Pjv/2wBDAQoLCw4NDhwQEBw7KCIoOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7"
    "Ozs7Ozs7Ozs7Ozs7Ozv/wAARCAEAAQADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAA"
    "AgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6"
    "Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXG"
    "x8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREA"
    "AgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5"
    "OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPE"
    "xcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDYLEgimnOaUD1pyoSwrybn05LCCBk1R1d/"
    "3JA9KusdoxWfqn+oJIzxRH4kEdzmomO4/Wp8kCq0Ryx471YNdsnqUkSRHLZq2h4GKpRcGriVnIaRMDn8aBwRSA0ueKgdhwNG"
    "etJmjOTQOwu40jHnNIx200PmgVh2elOOaj3c0/dkYoAQnJzSZPFK3Smk0wsB5HFVpwSMVZzmoZeh9aqJLRPps4+4eorWYbgC"
    "K5+0ytwCK6CBgUFTUiQw2nFNxipc44pjelYMENz2rb0S7Vo/JOAy/rWIQaWCdra4WVex59xQ1dEThzKxN4x0122XyZIXhh7V"
    "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"
)


def _decode_fixture() -> np.ndarray:
    raw_bytes = base64.b64decode(LENA_FIXTURE_B64)
    image_np = np.frombuffer(raw_bytes, dtype=np.uint8)
    frame = cv2.imdecode(image_np, cv2.IMREAD_COLOR)
    assert frame is not None
    return frame


def _request_from_frame(frame: np.ndarray) -> FaceTouchAnalyzeRequest:
    ok, encoded = cv2.imencode(
        ".jpg",
        frame,
        [int(cv2.IMWRITE_JPEG_QUALITY), 55],
    )
    assert ok
    return FaceTouchAnalyzeRequest(
        image="data:image/jpeg;base64," + base64.b64encode(encoded.tobytes()).decode("ascii"),
        timestamp=0,
        sample_rate_fps=10,
    )


def _make_small_face_landscape_frame(face_size: int = 96) -> np.ndarray:
    face = cv2.resize(_decode_fixture(), (face_size, face_size), interpolation=cv2.INTER_AREA)
    canvas = np.full((480, 640, 3), 235, dtype=np.uint8)
    x = (canvas.shape[1] - face.shape[1]) // 2
    y = (canvas.shape[0] - face.shape[0]) // 2
    canvas[y : y + face.shape[0], x : x + face.shape[1]] = face
    return canvas


def test_detects_face_landmarks_in_standard_square_frame():
    frame = cv2.resize(_decode_fixture(), (320, 320), interpolation=cv2.INTER_AREA)

    response = analyze_face_touch_frame(_request_from_frame(frame))

    assert response.faceDetected is True
    assert response.overlay.faceBox is not None
    assert len(response.overlay.facePoints) > 0


def test_detects_face_landmarks_when_face_is_small_in_landscape_frame():
    frame = _make_small_face_landscape_frame(face_size=96)

    response = analyze_face_touch_frame(_request_from_frame(frame))

    assert response.faceDetected is True
    assert response.overlay.faceBox is not None
    assert len(response.overlay.facePoints) > 0


def _synthetic_hand_points(z_by_index: dict[int, float]) -> list[Point]:
    points = [Point(x=300.0, y=240.0, z=0.0) for _ in range(21)]
    for index in range(21):
        points[index] = Point(
            x=260.0 + (index % 5) * 24.0,
            y=170.0 + (index // 5) * 38.0,
            z=z_by_index.get(index, -0.02),
        )
    return points


def test_depth_assessment_penalizes_hand_projected_on_face_but_closer_to_camera():
    face_box = Box(x=220.0, y=120.0, width=200.0, height=240.0)
    hand_box = Box(x=210.0, y=105.0, width=230.0, height=265.0)
    hand_points = _synthetic_hand_points(
        {
            0: 0.03,
            **{index: -0.46 for index in ALL_CONTACT_INDICES},
        }
    )

    assessment = _hand_depth_assessment(hand_points, hand_box, face_box)

    assert assessment.foreground_score >= 0.70
    assert assessment.touch_multiplier <= 0.30


def test_depth_assessment_preserves_side_face_contact_with_flat_depth():
    face_box = Box(x=220.0, y=120.0, width=200.0, height=240.0)
    hand_box = Box(x=145.0, y=195.0, width=125.0, height=145.0)
    hand_points = _synthetic_hand_points({index: -0.03 for index in range(21)})

    assessment = _hand_depth_assessment(hand_points, hand_box, face_box)

    assert assessment.foreground_score <= 0.35
    assert assessment.touch_multiplier >= 0.80
