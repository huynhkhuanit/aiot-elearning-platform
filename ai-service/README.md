# AI Roadmap Generator Service

Python FastAPI service that generates personalized learning roadmaps using AI.

## Features

- **Personalized Roadmaps**: Generates learning paths based on user profile
- **JSON Mode**: Uses OpenAI's JSON mode for structured output
- **Streaming Support**: SSE streaming for better UX
- **Metrics Tracking**: Tracks tokens, latency, and personalization scores

## Tech Stack

- **FastAPI** - Modern Python web framework
- **OpenAI GPT-4o-mini** - AI model for generation
- **Pydantic** - Data validation
- **SSE-Starlette** - Server-Sent Events for streaming

## Setup

### 1. Create Virtual Environment

```bash
cd ai-service
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your OpenAI API key
```

### 4. Run Development Server

```bash
python main.py
# or
uvicorn main:app --reload --port 8000
```

## API Endpoints

### POST /api/generate-roadmap

Generate a complete roadmap (non-streaming).

**Request:**
```json
{
  "profile": {
    "current_role": "Sinh viên năm 3",
    "target_role": "Frontend Developer",
    "current_skills": ["HTML/CSS", "JavaScript cơ bản"],
    "skill_level": "beginner",
    "learning_style": ["video", "project"],
    "hours_per_week": 15,
    "target_months": 6,
    "preferred_language": "vi"
  }
}
```

**Response:**
```json
{
  "success": true,
  "roadmap": {
    "roadmap_title": "Lộ trình Frontend Developer",
    "roadmap_description": "...",
    "total_estimated_hours": 300,
    "phases": [...],
    "nodes": [...],
    "edges": [...]
  },
  "metadata": {
    "model": "gpt-4o-mini",
    "input_tokens": 650,
    "output_tokens": 2500,
    "latency_ms": 8500,
    "personalization_score": 0.85
  }
}
```

### POST /api/generate-roadmap/stream

Generate with Server-Sent Events streaming.

### POST /api/validate-profile

Validate user profile without generating.

### GET /health

Health check endpoint.

## Docker

### Build

```bash
docker build -t ai-roadmap-service .
```

### Run

```bash
docker run -p 8000:8000 --env-file .env ai-roadmap-service
```

## Project Structure

```
ai-service/
├── main.py                 # FastAPI app entry
├── requirements.txt        # Dependencies
├── Dockerfile             # Container config
├── .env.example           # Environment template
├── app/
│   ├── __init__.py
│   ├── config.py          # Settings
│   ├── models/            # Pydantic models
│   │   ├── request.py
│   │   └── response.py
│   ├── services/          # Business logic
│   │   ├── openai_service.py
│   │   └── roadmap_generator.py
│   ├── prompts/           # AI prompts
│   │   └── system_prompts.py
│   └── routers/           # API routes
│       └── roadmap.py
```

## Metrics for Thesis

| Metric | Target | Description |
|--------|--------|-------------|
| Latency (Full) | < 15s | Time for complete response |
| Latency (Stream) | < 5s | Time to first token |
| Input Tokens | ~500-800 | Prompt size |
| Output Tokens | ~2000-4000 | Response size |
| Cost/Generation | ~$0.01-0.02 | API cost |
| Personalization Score | > 0.8 | Quality metric |
