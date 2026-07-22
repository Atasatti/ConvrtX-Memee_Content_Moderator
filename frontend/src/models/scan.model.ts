import type { RiskLevel } from "./common.model";

/** Which analyzer produced a scan. Persisted, so these strings are a contract. */
export type ScanKind = "text" | "number" | "image" | "image-text" | "audio" | "video";

export const SCAN_KIND_LABELS: Record<ScanKind, string> = {
  text: "Text",
  number: "Number check",
  image: "Image",
  "image-text": "Image OCR",
  audio: "Audio",
  video: "Video",
};

/**
 * One entry in the persistent scan log. Deliberately small and self-describing:
 * uploaded media is not archived alongside this database record.
 */
export interface ScanRecord {
  id: string;
  kind: ScanKind;
  /** Filename, or a truncated excerpt for text scans. */
  subject: string;
  createdAt: string;
  flagged: boolean;
  risk: RiskLevel;
  /** One-line human summary, e.g. "Explicit 94% · 3 unsafe frames". */
  summary: string;
  durationMs: number;
}

export interface ScanStats {
  total: number;
  flagged: number;
  clean: number;
  flaggedRate: number;
  byKind: Record<ScanKind, number>;
  /** Most recent first, capped by the caller. */
  recent: ScanRecord[];
}
