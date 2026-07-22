import type { RiskLevel } from "./common.model";

/** One OpenAI moderation category with its normalized 0–1 score. */
export interface CategoryScore {
  /** Normalized key, e.g. `self_harm_intent`. */
  id: string;
  /** Human-readable label, e.g. "Self-harm intent". */
  label: string;
  score: number;
  risk: RiskLevel;
}

/**
 * The result of moderating a piece of text — whether it came from a comment,
 * OCR on an image, or a Whisper transcript.
 */
export interface ModerationVerdict {
  flagged: boolean;
  /** Highest-scoring category id, or null when the API returned no scores. */
  dominantCategory: string | null;
  dominantLabel: string | null;
  topScore: number;
  risk: RiskLevel;
  /** All categories, sorted by score descending. */
  categories: CategoryScore[];
  /** Phone numbers detected by the GPT number-extraction pass. */
  detectedNumbers: string[];
  /**
   * The text the verdict was actually computed from, when the caller did not
   * supply it directly — currently OCR output from an image. Empty otherwise.
   */
  extractedText: string;
}

/** Result of the standalone phone-number check (`POST /text/check_number`). */
export interface NumberCheckResult {
  flagged: boolean;
  numbers: string[];
}

export const EMPTY_VERDICT: ModerationVerdict = {
  flagged: false,
  dominantCategory: null,
  dominantLabel: null,
  topScore: 0,
  risk: "safe",
  categories: [],
  detectedNumbers: [],
  extractedText: "",
};
