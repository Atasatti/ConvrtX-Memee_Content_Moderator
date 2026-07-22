# Aegis demo video

`aegis-demo.mp4` — 63s, 1920×1080, H.264 + AAC, ~5 MB. Sized for LinkedIn and
Upwork uploads.

It is a recording of the real app. The frontend talks to the live FastAPI
backend throughout, and every verdict, percentage, and latency on screen is
what the models actually returned during that take. Nothing is mocked or
reconstructed in After Effects.

## Publish safety

The image scene deliberately runs the explicit NSFW fixture through the
classifier, because a moderation tool that never catches anything proves
nothing. It is made safe to publish at capture time, in the recorder's injected
stylesheet — the product's own code is untouched:

- a 58px blur with saturation and brightness pulled down,
- an opaque scrim over the whole preview plate,
- a `SENSITIVE PREVIEW BLURRED` label so the obscuring reads as deliberate.

Verified frame by frame across the scene: the plate is featureless, with no
recoverable detail. Uploads are also copied to neutral filenames first
(`ugc-upload-8842.jpg`), so no fixture name reaches the file chip, the activity
feed, or the audit trail.

`demo-assets/` holds those copies, including the explicit one. It is gitignored
and safe to delete — the recorder recreates it.

## Rebuilding

Both servers must be up, and the frontend should be a production build so no
dev overlay is captured:

```bash
cd backend && ./.venv/bin/python main.py          # :8000
cd frontend && npm run build && npm run start     # :3000
```

Then:

```bash
cd video
npm install
npx playwright install chromium   # first run only
node seed-demo-data.mjs           # backdates a plausible moderation backlog
node record-demo.mjs              # drives the UI, writes raw/ + manifest
node build-video.mjs              # composes aegis-demo.mp4
```

`seed-demo-data.mjs` **replaces** the contents of
`database/history/aegis-history.sqlite3`. Back that file up first if it holds
anything you want to keep.

## How it fits together

`record-demo.mjs` drives Chromium through Playwright with a synthetic cursor
(the real pointer moves with it, so hover states fire) and captures frames over
the CDP screencast API. Chromium only emits a frame when something repaints, so
the manifest stores per-frame timestamps and `build-video.mjs` reconstructs real
time from them — including an explicit tail, since the closing hold has no
following frame to measure against.

Captions are generated from `manifest.facts`, which the recorder reads back out
of the app's own history records after the take. Re-recording therefore updates
the on-screen numbers automatically; there are no hardcoded figures to go stale.

The video analyzer genuinely takes ~14s. Rather than cut it, the middle of the
wait is time-lapsed 6× so the elapsed-time readout on screen stays honest.

## Editing

- Chapter copy, ordering, and the technical chips: `CHAPTERS` in `build-video.mjs`.
- The name on the closing card: `AUTHOR` at the top of `build-video.mjs`.
- Window placement and framing: `WIN`.
- The audio bed is a synthesised A-minor pad (mean −24 dB, well under the
  footage). To drop in a licensed track instead, mux over the built file:

  ```bash
  ffmpeg -i aegis-demo.mp4 -i track.mp3 -map 0:v -map 1:a \
    -c:v copy -c:a aac -b:a 192k -shortest aegis-demo-scored.mp4
  ```
