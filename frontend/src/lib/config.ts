/** Runtime configuration, read once from the environment. */

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000"
).replace(/\/+$/, "");

/**
 * Per-operation timeouts. Video analysis decodes every sampled frame through the
 * NSFW model and then transcribes the audio track through Whisper, so it needs
 * far more headroom than a text call.
 */
export const TIMEOUTS_MS = {
  health: 5_000,
  history: 10_000,
  text: 60_000,
  image: 180_000,
  audio: 300_000,
  video: 900_000,
} as const;

/** Client-side guardrails so obviously-too-large files fail before upload. */
export const MAX_UPLOAD_BYTES = {
  image: 15 * 1024 * 1024,
  audio: 100 * 1024 * 1024,
  video: 500 * 1024 * 1024,
} as const;

export const ACCEPTED_TYPES = {
  image: ["image/png", "image/jpeg", "image/webp", "image/gif", "image/bmp"],
  audio: ["audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/mp4", "audio/m4a", "audio/webm", "audio/ogg"],
  video: ["video/mp4", "video/quicktime", "video/x-msvideo", "video/x-ms-wmv", "video/webm"],
} as const;

/** Extensions the video route accepts (it validates by filename, not MIME type). */
export const VIDEO_EXTENSIONS = [".mp4", ".avi", ".mov", ".wmv"] as const;

export const HISTORY_STORAGE_KEY = "aegis.scan-history.v1";
