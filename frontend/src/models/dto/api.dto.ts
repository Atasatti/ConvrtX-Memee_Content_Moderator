/**
 * Wire shapes returned by the FastAPI backend, transcribed exactly as they come
 * off the network. Nothing outside `mappers.ts` should import these — the rest
 * of the app works with the domain models instead.
 */

/** `POST /text/analyze`, `/image/check_text`, `/audio/transcribe`, `/audio/transcribe_video` */
export interface ModerationResponseDto {
  flagged?: boolean;
  /** Older field name still emitted by some routes. */
  flag?: boolean;
  type?: string | null;
  category_scores?: Record<string, number> | number[] | null;
  numbers?: unknown[] | null;
  /** Text OCR recovered from an image. Absent on routes given text directly. */
  extracted_text?: string | null;
  /** Present instead of the above when the service caught an exception. */
  error?: string;
}

/** `POST /text/check_number` */
export interface NumberCheckResponseDto {
  flagged?: boolean;
  numbers?: unknown[] | null;
}

/** `POST /image/predict` */
export interface ImagePredictResponseDto {
  image_classification?: {
    predictions?: Record<string, number> | null;
    top_category?: string | null;
  } | null;
  text_analysis?: ModerationResponseDto | null;
}

/** `POST /video/analyze_video` */
export interface VideoAnalyzeResponseDto {
  Frames_classification?: {
    predictions?: Record<string, number>[] | null;
    top_categories?: string[] | null;
    frame_count?: number | null;
  } | null;
  Audio_analysis?: ModerationResponseDto | null;
}

/** `GET /health` */
export interface HealthResponseDto {
  status?: string;
  service?: string;
  version?: string;
}
