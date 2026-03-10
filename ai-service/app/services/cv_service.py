"""
CV Builder Service - AI-powered CV content suggestions using Ollama.
Uses qwen2.5:7b-instruct for Vietnamese CV writing assistance.
"""

import logging
import json
from typing import Optional
from app.services.ollama_service import ollama_chat, OllamaServiceError

logger = logging.getLogger(__name__)

CV_MODEL = "qwen2.5:7b-instruct"

# ── System prompts per section type ────────────────────────────

CV_SYSTEM_PROMPTS = {
    "overview": """Bạn là chuyên gia viết CV tiếng Việt. Hãy viết phần "Mục tiêu nghề nghiệp" (Career Objective/Summary) cho ứng viên.
Quy tắc:
- Viết 2-3 câu ngắn gọn, súc tích
- Nêu rõ số năm kinh nghiệm, kỹ năng cốt lõi
- Đề cập đến vị trí mong muốn
- Trả về CHỈ nội dung viết, không giải thích thêm""",

    "experience": """Bạn là chuyên gia viết CV tiếng Việt. Hãy viết mô tả kinh nghiệm làm việc cho ứng viên.
Quy tắc:
- Viết 4-6 bullet points dùng gạch đầu dòng
- Mỗi bullet bắt đầu bằng động từ hành động mạnh
- Thêm số liệu cụ thể khi có thể (%, số lượng)
- Nhấn mạnh thành tích thay vì chỉ mô tả trách nhiệm
- Trả về CHỈ các bullet points, không giải thích thêm""",

    "education": """Bạn là chuyên gia viết CV tiếng Việt. Hãy viết phần học vấn cho ứng viên.
Quy tắc:
- Format: Tên trường, Chuyên ngành, Thời gian, GPA (nếu tốt)
- Liệt kê thành tích học tập nổi bật
- Đề cập đồ án tốt nghiệp nếu liên quan
- Trả về CHỈ nội dung, không giải thích thêm""",

    "skills": """Bạn là chuyên gia viết CV tiếng Việt. Hãy gợi ý danh sách kỹ năng phù hợp cho vị trí ứng tuyển.
Quy tắc:
- Phân nhóm theo: Ngôn ngữ lập trình, Framework, Database, DevOps, Kỹ năng mềm
- Ưu tiên kỹ năng phù hợp nhất với vị trí
- Trả về CHỈ danh sách kỹ năng theo nhóm, không giải thích thêm""",

    "projects": """Bạn là chuyên gia viết CV tiếng Việt. Hãy viết mô tả dự án cho CV.
Quy tắc:
- Format: Tên dự án | Tech stack
- Vai trò trong dự án
- 2-3 bullet points mô tả đóng góp và kết quả
- Nhấn mạnh impact và số liệu
- Trả về CHỈ mô tả dự án, không giải thích thêm""",

    "certifications": """Bạn là chuyên gia viết CV tiếng Việt. Hãy gợi ý chứng chỉ phù hợp cho vị trí ứng tuyển.
Quy tắc:
- Liệt kê 3-5 chứng chỉ phổ biến và có giá trị
- Format: Tên chứng chỉ - Tổ chức cấp
- Trả về CHỈ danh sách chứng chỉ, không giải thích thêm""",
}

DEFAULT_SYSTEM_PROMPT = """Bạn là chuyên gia viết CV tiếng Việt. Hãy viết nội dung cho phần được yêu cầu.
Quy tắc:
- Viết chuyên nghiệp, ngắn gọn
- Phù hợp với thị trường Việt Nam
- Trả về CHỈ nội dung cần viết, không giải thích thêm"""


async def suggest_cv_content(
    section_type: str,
    current_content: str = "",
    role: str = "Fullstack Developer",
) -> dict:
    """
    Generate AI suggestion for a CV section using Ollama qwen2.5:7b-instruct.

    Args:
        section_type: Type of CV section (overview, experience, etc.)
        current_content: Existing content in the section (for context)
        role: Target job role

    Returns:
        dict with 'suggestion' and 'model' keys
    """
    system_prompt = CV_SYSTEM_PROMPTS.get(section_type, DEFAULT_SYSTEM_PROMPT)

    user_message = f"Vị trí ứng tuyển: {role}\n"
    if current_content.strip():
        user_message += f"Nội dung hiện tại:\n{current_content}\n\nHãy cải thiện hoặc bổ sung nội dung trên."
    else:
        user_message += f"Hãy viết nội dung mẫu cho phần này."

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_message},
    ]

    try:
        result = await ollama_chat(
            messages=messages,
            model=CV_MODEL,
            temperature=0.7,
            max_tokens=1024,
        )
        return {
            "suggestion": result.get("content", "").strip(),
            "model": result.get("model", CV_MODEL),
            "source": "ai",
        }
    except OllamaServiceError as e:
        logger.error(f"Ollama CV suggestion error: {e.message}")
        raise
    except Exception as e:
        logger.error(f"CV suggestion error: {str(e)}")
        raise OllamaServiceError(f"CV suggestion failed: {str(e)}")


async def parse_pdf_to_cv_json(text_content: str) -> dict:
    """
    Use AI to structure extracted PDF text into CV JSON format.

    Args:
        text_content: Raw text extracted from PDF

    Returns:
        dict with structured CV data
    """
    system_prompt = """Bạn là AI chuyên phân tích CV. Hãy đọc nội dung text từ CV dưới đây và trích xuất dữ liệu thành JSON.

Format JSON cần trả về:
{
  "personalInfo": {
    "fullName": "", "jobTitle": "", "phone": "", "email": "",
    "address": "", "birthDate": ""
  },
  "sections": [
    {
      "type": "overview|experience|education|skills|projects|certifications",
      "title": "",
      "items": [
        {
          "label": "", "value": "",
          "bullets": ["..."],
          "meta": { "company": "", "period": "", "location": "" }
        }
      ]
    }
  ]
}

Quy tắc:
- Trả về CHỈ JSON object, không thêm text khác
- Tự detect loại section dựa trên nội dung
- Giữ nguyên nội dung gốc, chỉ cấu trúc lại
- Nếu không detect được field, để chuỗi rỗng"""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"Nội dung CV:\n\n{text_content[:4000]}"},
    ]

    try:
        result = await ollama_chat(
            messages=messages,
            model=CV_MODEL,
            temperature=0.1,
            max_tokens=4096,
        )

        content = result.get("content", "").strip()

        # Try to parse JSON from response
        # Handle markdown code blocks
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()

        parsed = json.loads(content)
        return {
            "cvData": parsed,
            "model": result.get("model", CV_MODEL),
            "source": "ai",
        }
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse CV JSON from AI: {e}")
        return {
            "cvData": None,
            "rawText": content if 'content' in dir() else "",
            "error": "Could not parse structured data from PDF",
            "source": "ai",
        }
    except OllamaServiceError as e:
        logger.error(f"Ollama PDF parse error: {e.message}")
        raise
