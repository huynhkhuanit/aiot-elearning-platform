"""
AI Roadmap Generator - FastAPI Application Entry Point
"""

import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.routers import roadmap

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    logger.info(f"[START] AI Roadmap Service (Groq + Llama 3)")
    logger.info(f"[ENV] {'Development' if settings.DEBUG else 'Production'}")
    logger.info(f"[MODEL] {settings.GROQ_MODEL}")
    api_key_preview = settings.GROQ_API_KEY[:15] + "..." if settings.GROQ_API_KEY and len(settings.GROQ_API_KEY) > 15 else "NOT SET"
    logger.info(f"[API_KEY] {api_key_preview} (length: {len(settings.GROQ_API_KEY) if settings.GROQ_API_KEY else 0})")
    yield
    # Shutdown
    logger.info("[STOP] Shutting down AI Roadmap Service")


app = FastAPI(
    title="AI Roadmap Generator",
    description="Generate personalized learning roadmaps using AI",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(roadmap.router)


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "ok",
        "service": "AI Roadmap Generator",
        "version": "1.0.0",
    }


@app.get("/health")
async def health_check():
    """Detailed health check"""
    api_key_preview = settings.GROQ_API_KEY[:15] + "..." if settings.GROQ_API_KEY and len(settings.GROQ_API_KEY) > 15 else "NOT SET"
    return {
        "status": "healthy",
        "groq_configured": bool(settings.GROQ_API_KEY),
        "api_key_preview": api_key_preview,
        "api_key_length": len(settings.GROQ_API_KEY) if settings.GROQ_API_KEY else 0,
        "model": settings.GROQ_MODEL,
        "provider": "groq",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
    )
