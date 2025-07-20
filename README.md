# ModerationAnalyzer

## Overview
ModerationAnalyzer is a FastAPI-based service for analyzing and moderating text, images, audio, and video content. It leverages OpenAI's models for text moderation, phone number detection, and audio transcription (Whisper), as well as a custom NSFW model for image and video analysis.

## Features
- **Text Moderation:** Detects inappropriate, harmful, or sensitive content and phone numbers in text.
- **Image Moderation:** Classifies images into NSFW categories and extracts/analyzes text from images.
- **Audio Moderation:** Transcribes audio files and analyzes the transcribed text for moderation.
- **Video Moderation:** Analyzes video frames for NSFW content and transcribes/analyzes audio from videos.

## Requirements
- Python 3.12+
- See `requirements.txt` for Python dependencies
- FFmpeg (must be installed and available in your system PATH)
- Pre-trained NSFW model (`nsfw.299x299.h5` in `nfsw_model/`)

## Installation
1. **Clone the repository:**
   ```sh
   git clone <repo-url>
   cd ModerationAnalyzer
   ```
2. **Install Python dependencies:**
   ```sh
   pip install -r requirements.txt
   ```
3. **Install FFmpeg:**
   - Windows: Use [WinGet](https://learn.microsoft.com/en-us/windows/package-manager/winget/) or download from [ffmpeg.org](https://ffmpeg.org/download.html)
   - Linux/macOS: Use your package manager (e.g., `sudo apt install ffmpeg`)
   - Ensure FFmpeg is in your system PATH.
4. **Add your OpenAI API key:**
   - Create a `.env` file in the root directory:
     ```env
     OPENAI_API_KEY=your_openai_api_key_here
     ```
5. **Ensure the NSFW model is present:**
   - Place `nsfw.299x299.h5` in the `nfsw_model/` directory.

## Running the Application
```sh
python main.py
```
The API will be available at [http://127.0.0.1:8000](http://127.0.0.1:8000)

## API Endpoints
### Text
- `POST /text/analyze` — Analyze text for moderation and phone numbers
- `POST /text/check_number` — Check for phone numbers in text

### Image
- `POST /image/predict` — Classify image and analyze extracted text
- `POST /image/check_text` — Extract and analyze text from image

### Audio
- `POST /audio/transcribe` — Transcribe and analyze audio file
- `POST /audio/transcribe_video` — Extract, transcribe, and analyze audio from video

### Video
- `POST /video/analyze_video` — Analyze video frames and audio

## Example Usage
You can use tools like [Postman](https://www.postman.com/) or `curl` to interact with the API. Example for text moderation:
```sh
curl -X POST "http://127.0.0.1:8000/text/analyze" -F "text=Your text here"
```

## Notes
- All endpoints support CORS and can be accessed from any origin.
- For best results, ensure your OpenAI API key is valid and you have a stable internet connection.
- The NSFW model is required for image and video analysis.

## License
MIT License 