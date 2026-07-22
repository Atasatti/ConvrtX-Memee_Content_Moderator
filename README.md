# Aegis

Content moderation for text, images, audio, and video — a FastAPI service and a
Next.js operator console.

```
.
├── backend/     FastAPI + OpenAI + a local NSFW model
├── frontend/    Aegis — Next.js 16 console, MVVM
└── database/    SQLite scan history (created at runtime)
```

| | |
| --- | --- |
| **Text** | OpenAI omni-moderation across 13 policy categories, plus GPT phone-number extraction |
| **Image** | NSFW Inception classifier over 5 classes, plus EasyOCR text moderation |
| **Audio** | Whisper transcription in one-minute chunks, then transcript moderation |
| **Video** | ~1 frame/second through the NSFW model, plus audio-track transcription |

## Quick start

Two terminals.

**1. Backend** — needs Python 3.10+, FFmpeg, and an OpenAI key:

```sh
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # add your OpenAI key
python main.py                # http://127.0.0.1:8000
```

The NSFW model must be at `backend/app/nsfw_model/nsfw.299x299.h5`
([download](https://drive.google.com/drive/folders/1lq-cZm6vqRbb03iWxYPZjPjcyg8AKN_b?usp=drive_link)).

**2. Frontend:**

```sh
cd frontend
npm install
npm run dev                   # http://localhost:3000
```

The console shows an API status badge in the sidebar — if it reads "offline,"
the backend is not up.

Sample media for trying the analyzers is kept in `backend/Data for testing apis/`
and is deliberately not published — the fixtures include explicit imagery used to
exercise the NSFW classifier. Supply your own files, or any image and video will
do.

Scan-history metadata is stored persistently in
`database/history/aegis-history.sqlite3`. SQLite is created automatically, has
no application-level record cap, and replaces the old 100-item browser history.
Uploaded media itself is not archived.

## Documentation

- [`backend/README.md`](backend/README.md) — endpoints, setup, behavior notes
- [`backend/API_DOCUMENTATION.md`](backend/API_DOCUMENTATION.md) — full response examples
- [`frontend/README.md`](frontend/README.md) — MVVM layering and the rules it enforces

## Security

`.env` is gitignored and must never be committed — it holds your OpenAI key.
Use `backend/.env.example` as the template.

Note that an OpenAI key was committed to this repository's history before that
rule existed. It is no longer tracked, but it remains reachable in past commits
and **should be rotated** at
[platform.openai.com](https://platform.openai.com/account/api-keys).

## Licence

Proprietary — copyright (c) 2026 Ata Ul Haq, all rights reserved. The source is
published for portfolio purposes only; no licence to use, copy, modify, or
distribute it is granted. See [LICENSE](LICENSE).
