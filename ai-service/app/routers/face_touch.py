"""
Face touch alert API router
"""

import logging
from fastapi import APIRouter, HTTPException

from app.models import FaceTouchAnalyzeRequest, FaceTouchAnalyzeResponse
from app.services.face_touch_service import analyze_face_touch_frame, FaceTouchServiceError

logger = logging.getLogger(__name__)


router = APIRouter(prefix="/api/face-touch", tags=["face-touch"])


@router.post("/analyze-frame", response_model=FaceTouchAnalyzeResponse)
async def analyze_frame(request: FaceTouchAnalyzeRequest):
    """Analyze a webcam frame and classify whether a hand is near or touching the face."""
    try:
        return analyze_face_touch_frame(request)
    except FaceTouchServiceError as error:
        logger.warning("Face touch analysis rejected: %s", error)
        raise HTTPException(status_code=400, detail=str(error)) from error
    except RuntimeError as error:
        logger.error("Face touch analysis unavailable: %s", error)
        raise HTTPException(status_code=503, detail=str(error)) from error
    except Exception as error:
        logger.exception("Unexpected face touch analysis error")
        raise HTTPException(status_code=500, detail=f"Internal error: {error}") from error