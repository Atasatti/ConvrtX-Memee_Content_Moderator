import { ACCEPTED_TYPES, MAX_UPLOAD_BYTES, VIDEO_EXTENSIONS } from "@/lib/config";
import type { AppError } from "./common.model";

export type UploadKind = "image" | "audio" | "video";

function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot).toLowerCase();
}

export function isVideoFile(file: File): boolean {
  return (
    file.type.startsWith("video/") ||
    (VIDEO_EXTENSIONS as readonly string[]).includes(extensionOf(file.name))
  );
}

/**
 * Rejects files the backend would reject anyway, so the user finds out before
 * uploading rather than after. Returns null when the file is acceptable.
 */
export function validateUpload(file: File, kind: UploadKind): AppError | null {
  const maxBytes = MAX_UPLOAD_BYTES[kind];
  if (file.size === 0) {
    return { message: "That file is empty." };
  }
  if (file.size > maxBytes) {
    return {
      message: "That file is too large.",
      detail: `${kind} uploads are capped at ${Math.round(maxBytes / (1024 * 1024))} MB.`,
    };
  }

  if (kind === "video") {
    // The video route validates by extension, so mirror that check exactly.
    if (!(VIDEO_EXTENSIONS as readonly string[]).includes(extensionOf(file.name))) {
      return {
        message: "Unsupported video format.",
        detail: `The API accepts ${VIDEO_EXTENSIONS.join(", ")}.`,
      };
    }
    return null;
  }

  if (kind === "image") {
    // The image route checks `content_type.startswith("image/")`.
    if (!file.type.startsWith("image/")) {
      return {
        message: "That file is not an image.",
        detail: `Accepted types: ${ACCEPTED_TYPES.image.join(", ")}.`,
      };
    }
    return null;
  }

  // Audio: the transcription page also accepts video files and pulls their track.
  if (!file.type.startsWith("audio/") && !isVideoFile(file)) {
    return {
      message: "That file is not audio or video.",
      detail: "Upload an audio file, or a video to transcribe its audio track.",
    };
  }
  return null;
}
