# Aegis — backend

FastAPI service for moderating text, images, audio, and video. Text moderation
and phone-number extraction run through OpenAI; transcription uses Whisper;
image and video frames are classified by a local NSFW Inception model.

## Requirements

- Python 3.10+
- FFmpeg on your `PATH` (`brew install ffmpeg`, or `winget install ffmpeg`)
- The NSFW model at `app/nsfw_model/nsfw.299x299.h5`
  ([download](https://drive.google.com/drive/folders/1lq-cZm6vqRbb03iWxYPZjPjcyg8AKN_b?usp=drive_link))

## Setup

```sh
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env      # then add your OpenAI key
```

## Running

```sh
python main.py            # http://127.0.0.1:8000
```

Interactive docs at http://127.0.0.1:8000/docs.

> Run from this `backend/` directory — `app/settings.py` loads `.env` relative to
> the working directory.

## Endpoints

| Method | Path | Body | Returns |
| --- | --- | --- | --- |
| GET | `/health` | — | Liveness, used by the frontend's status badge |
| POST | `/text/analyze` | form `text` | `flagged`, `type`, `category_scores`, `numbers` |
| POST | `/text/check_number` | form `text` | `flagged`, `numbers` |
| POST | `/image/predict` | file `file` | NSFW class scores + OCR text moderation |
| POST | `/image/check_text` | file `file` | OCR text moderation only |
| POST | `/audio/transcribe` | file `audio_file` | Transcript moderation |
| POST | `/audio/transcribe_video` | file `video_file` | Audio-track transcript moderation |
| POST | `/video/analyze_video` | file `file` | Per-frame NSFW scores + audio moderation |
| GET | `/history` | — | All persisted scan-history records |
| POST | `/history` | JSON scan record | Persist one scan-history record |
| POST | `/history/import` | JSON record list | Import legacy browser history |
| DELETE | `/history/{id}` | — | Delete one history record |
| DELETE | `/history` | — | Clear all history records |

See `API_DOCUMENTATION.md` for full response examples.

## Persistent history

Scan-history metadata is stored in the project-level SQLite database at
`../database/history/aegis-history.sqlite3`. There is no 100-record cap. The
database is created automatically and ignored by Git. Uploaded media is not
archived in the database.

## Notes on behavior

- **Flag threshold.** `analyze_text` flags content when any moderation category
  scores above `0.75`. The frontend's risk bands are aligned to that boundary.
- **Chunking.** Audio is split into one-minute chunks before transcription, then
  the transcripts are concatenated and moderated as one string.
- **Frame sampling.** `/video/analyze_video` scores roughly one frame per second,
  so a frame's index approximates its timestamp in seconds.
- **Cost.** Every text, audio, and video call hits the OpenAI API. Video is the
  most expensive path: frame inference plus Whisper on the full audio track.
