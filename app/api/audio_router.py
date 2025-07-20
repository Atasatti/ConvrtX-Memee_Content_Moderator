import io
from fastapi.responses import JSONResponse
from fastapi import APIRouter, UploadFile, HTTPException
from ..services import transcribe_audio_file
# from pydub import AudioSegment
# from io import BytesIO

audio_router = APIRouter(prefix="/audio", tags=["Audio"])

@audio_router.post("/transcribe")
async def validate_audio_file(audio_file: UploadFile) -> JSONResponse:
    try:
        audio_content = await audio_file.read()
        result = await transcribe_audio_file(audio_content, audio_file.filename)
        return result
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing audio: {str(e)}")

from moviepy.editor import VideoFileClip
import io
import ffmpeg

@audio_router.post("/transcribe_video")
async def validate_video_audio_file(video_file: UploadFile):
    try:
        video_content = await video_file.read()
        video_buffer = io.BytesIO(video_content)

        try:
            process = (
                ffmpeg
                .input("pipe:0", format="mp4")
                .output("pipe:1", format="wav")
                .run(capture_stdout=True, capture_stderr=True, input=video_buffer.read())
            )
            audio_content = process[0]
            
            result = await transcribe_audio_file(audio_content, video_file.filename)
            return result

        except ffmpeg.Error as e:
            raise HTTPException(
                status_code=500,
                detail=f"FFmpeg error: {e.stderr.decode() if e.stderr else str(e)}"
            )
            
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing video: {str(e)}"
        )