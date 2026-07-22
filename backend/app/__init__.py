from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.audio_router import audio_router
from .api.text_router import text_router
from .api.image_router import image_router
from .api.video_router import video_router
from .api.history_router import history_router

# Main router that includes all sub-routers
app = FastAPI(
        title="Aegis API",
        description="Handling of Comment, Audio, Image and Video file using OpenAI (whisper and Moderation) and NSFW Model",
        version="1.0.0",
    )

# Configure CORS
app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(audio_router)
app.include_router(text_router)
app.include_router(image_router)
app.include_router(video_router)
app.include_router(history_router)


@app.get("/health", tags=["System"])
async def health():
    """Liveness probe used by the Aegis frontend to show API connectivity."""
    return {"status": "ok", "service": "aegis-api", "version": app.version}
