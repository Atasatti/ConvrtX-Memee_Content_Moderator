from .utils import WhisperService
from .moderation_service import analyze_text
from pydub import AudioSegment
from io import BytesIO
import io

whisper_service = WhisperService()

def process_audio(audio_bytes):
    # Load audio from bytes
    audio = AudioSegment.from_file(BytesIO(audio_bytes))
    
    # Get duration in seconds
    duration_seconds = len(audio) / 1000  # pydub gives duration in milliseconds
    print(f"Audio Duration: {duration_seconds} seconds")
    
    # Create chunks of 1 minute (60 seconds)
    chunk_duration_ms = 60 * 1000  # 1 minute in milliseconds
    chunks = [audio[i:i + chunk_duration_ms] for i in range(0, len(audio), chunk_duration_ms)]
    
    # Export each chunk to raw bytes
    chunk_bytes = [BytesIO() for _ in chunks]
    for i, chunk in enumerate(chunks):
        chunk.export(chunk_bytes[i], format="wav")  # Export as WAV
        chunk_bytes[i].seek(0)  # Reset pointer to the beginning of the buffer
    
    return chunk_bytes


async def transcribe_audio_file(audio_content, audio_filename) -> str:
    try:
        chunks = process_audio(audio_content)

        print(f"Total Chunks: {len(chunks)}")

        transcripts = []
        for i, chunk_buffer in enumerate(chunks):
            chunk_buffer.name = audio_filename  # Set the filename attribute for compatibility
            print(f"Transcribing chunk {i+1} of {len(chunks)}")
            transcript = whisper_service.transcribe_audio(chunk_buffer)
            print(f"Transcript: {transcript.text}")
            transcripts.append(transcript.text)  # Collect the text
        
        # Combine all transcripts into a single string
        transcript_text = "".join(transcripts)
        
        return await analyze_text(transcript_text)
    except Exception as e:
        print("Error transcribing audio: ", e)
        


