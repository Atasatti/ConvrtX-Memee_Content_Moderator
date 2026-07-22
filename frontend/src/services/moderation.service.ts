import { TIMEOUTS_MS } from "@/lib/config";
import type { Result } from "@/models/common.model";
import { Err, Ok } from "@/models/common.model";
import type {
  ImagePredictResponseDto,
  ModerationResponseDto,
  NumberCheckResponseDto,
  VideoAnalyzeResponseDto,
} from "@/models/dto/api.dto";
import {
  toImageAnalysis,
  toModerationVerdict,
  toNumberCheckResult,
  toVideoAnalysis,
} from "@/models/dto/mappers";
import type { ModerationVerdict, NumberCheckResult } from "@/models/moderation.model";
import type { ImageAnalysis, VideoAnalysis } from "@/models/nsfw.model";
import type { RequestOptions } from "./http/apiClient";
import { apiClient } from "./http/apiClient";

/** Maps a successful DTO through a converter, passing failures straight through. */
function mapResult<TDto, TDomain>(
  result: Result<TDto>,
  convert: (dto: TDto) => TDomain,
): Result<TDomain> {
  return result.ok ? Ok(convert(result.value)) : Err(result.error);
}

/**
 * Every backend endpoint, expressed in domain terms. This is the only module
 * that knows the API's URLs and form-field names.
 */
export const moderationService = {
  /** `POST /text/analyze` — form field `text`. */
  analyzeText(
    text: string,
    options: RequestOptions = {},
  ): Promise<Result<ModerationVerdict>> {
    const form = new FormData();
    form.append("text", text);
    return apiClient
      .postForm<ModerationResponseDto>("/text/analyze", form, {
        timeoutMs: TIMEOUTS_MS.text,
        ...options,
      })
      .then((result) => mapResult(result, toModerationVerdict));
  },

  /** `POST /text/check_number` — form field `text`. */
  checkNumbers(
    text: string,
    options: RequestOptions = {},
  ): Promise<Result<NumberCheckResult>> {
    const form = new FormData();
    form.append("text", text);
    return apiClient
      .postForm<NumberCheckResponseDto>("/text/check_number", form, {
        timeoutMs: TIMEOUTS_MS.text,
        ...options,
      })
      .then((result) => mapResult(result, toNumberCheckResult));
  },

  /** `POST /image/predict` — NSFW classification plus OCR moderation. */
  analyzeImage(
    file: File,
    options: RequestOptions = {},
  ): Promise<Result<ImageAnalysis>> {
    const form = new FormData();
    form.append("file", file);
    return apiClient
      .postForm<ImagePredictResponseDto>("/image/predict", form, {
        timeoutMs: TIMEOUTS_MS.image,
        ...options,
      })
      .then((result) => mapResult(result, toImageAnalysis));
  },

  /** `POST /image/check_text` — OCR moderation only, no pixel classification. */
  analyzeImageText(
    file: File,
    options: RequestOptions = {},
  ): Promise<Result<ModerationVerdict>> {
    const form = new FormData();
    form.append("file", file);
    return apiClient
      .postForm<ModerationResponseDto>("/image/check_text", form, {
        timeoutMs: TIMEOUTS_MS.image,
        ...options,
      })
      .then((result) => mapResult(result, toModerationVerdict));
  },

  /** `POST /audio/transcribe` — form field `audio_file`. */
  analyzeAudio(
    file: File,
    options: RequestOptions = {},
  ): Promise<Result<ModerationVerdict>> {
    const form = new FormData();
    form.append("audio_file", file);
    return apiClient
      .postForm<ModerationResponseDto>("/audio/transcribe", form, {
        timeoutMs: TIMEOUTS_MS.audio,
        ...options,
      })
      .then((result) => mapResult(result, toModerationVerdict));
  },

  /** `POST /audio/transcribe_video` — audio track only, form field `video_file`. */
  analyzeVideoAudio(
    file: File,
    options: RequestOptions = {},
  ): Promise<Result<ModerationVerdict>> {
    const form = new FormData();
    form.append("video_file", file);
    return apiClient
      .postForm<ModerationResponseDto>("/audio/transcribe_video", form, {
        timeoutMs: TIMEOUTS_MS.video,
        ...options,
      })
      .then((result) => mapResult(result, toModerationVerdict));
  },

  /** `POST /video/analyze_video` — sampled frames plus the audio track. */
  analyzeVideo(
    file: File,
    options: RequestOptions = {},
  ): Promise<Result<VideoAnalysis>> {
    const form = new FormData();
    form.append("file", file);
    return apiClient
      .postForm<VideoAnalyzeResponseDto>("/video/analyze_video", form, {
        timeoutMs: TIMEOUTS_MS.video,
        ...options,
      })
      .then((result) => mapResult(result, toVideoAnalysis));
  },
};
