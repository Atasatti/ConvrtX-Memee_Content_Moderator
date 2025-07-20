from openai import OpenAI
from pathlib import Path
from app.settings import settings

class WhisperService:
    def __init__(self, ):
        self.client = OpenAI(api_key=settings.openai_api_key)

    def transcribe_audio(self, audio_buffer) -> str:
        """
        Transcribe audio file using OpenAI's Whisper API.
        
        Args:
            audio_file_path: Path to the audio file (supports mp3, mp4, mpeg, mpga, m4a, wav, webm)
            
        Returns:
            str: Transcribed text from the audio
            
        Raises:
            Exception: If transcription fails or file doesn't exist
        """
        
        try:
            if not audio_buffer:
                raise FileNotFoundError(f"Audio bytes corrupted")

            transcription = self.client.audio.transcriptions.create(
                model="whisper-1", file=audio_buffer, language="en"
            )
        except Exception as e:
            raise Exception(f"Failed to transcribe audio: {str(e)}")
        return transcription