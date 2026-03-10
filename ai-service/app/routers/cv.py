"""
CV Builder Router - AI-powered CV content suggestions and PDF parsing.
"""

import logging
import io
from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel, Field
from typing import Optional

from app.services.cv_service import suggest_cv_content, parse_pdf_to_cv_json
from app.services.ollama_service import OllamaServiceError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/cv", tags=["CV Builder"])


# ── Request/Response Models ────────────────────────────────────

class CVSuggestRequest(BaseModel):
    section_type: str = Field(..., description="CV section type: overview, experience, education, skills, projects, certifications")
    current_content: str = Field(default="", description="Existing content in the section")
    role: str = Field(default="Fullstack Developer", description="Target job role")


class CVSuggestResponse(BaseModel):
    suggestion: str
    model: str
    source: str = "ai"


class CVParseResponse(BaseModel):
    cv_data: Optional[dict] = None
    raw_text: Optional[str] = None
    error: Optional[str] = None
    source: str = "ai"


# ── Endpoints ──────────────────────────────────────────────────

@router.post("/suggest", response_model=CVSuggestResponse)
async def suggest_content(request: CVSuggestRequest):
    """
    Generate AI-powered content suggestion for a CV section.
    Uses Ollama qwen2.5:7b-instruct for Vietnamese CV writing.
    """
    try:
        result = await suggest_cv_content(
            section_type=request.section_type,
            current_content=request.current_content,
            role=request.role,
        )
        return CVSuggestResponse(
            suggestion=result["suggestion"],
            model=result["model"],
            source=result["source"],
        )
    except OllamaServiceError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        logger.error(f"CV suggest error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/parse-pdf", response_model=CVParseResponse)
async def parse_pdf(file: UploadFile = File(...)):
    """
    Parse a PDF CV file and extract structured JSON data.
    Uses PyMuPDF for text extraction and Ollama for structuring.
    """
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    try:
        content = await file.read()

        # Extract text from PDF using PyMuPDF
        try:
            import fitz  # PyMuPDF
            pdf_doc = fitz.open(stream=content, filetype="pdf")
            text_parts = []
            for page in pdf_doc:
                text_parts.append(page.get_text())
            pdf_doc.close()
            raw_text = "\n".join(text_parts).strip()
        except ImportError:
            # Fallback: try pdfplumber
            try:
                import pdfplumber
                with pdfplumber.open(io.BytesIO(content)) as pdf:
                    text_parts = [page.extract_text() or "" for page in pdf.pages]
                raw_text = "\n".join(text_parts).strip()
            except ImportError:
                raise HTTPException(
                    status_code=500,
                    detail="PDF parsing requires PyMuPDF or pdfplumber. Install with: pip install PyMuPDF"
                )

        if not raw_text:
            raise HTTPException(status_code=400, detail="Could not extract text from PDF. The file may be image-based.")

        # Use AI to structure the extracted text
        result = await parse_pdf_to_cv_json(raw_text)

        return CVParseResponse(
            cv_data=result.get("cvData"),
            raw_text=raw_text[:2000],  # Return first 2000 chars for preview
            error=result.get("error"),
            source=result.get("source", "ai"),
        )
    except HTTPException:
        raise
    except OllamaServiceError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        logger.error(f"PDF parse error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
