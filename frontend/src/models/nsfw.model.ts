import type { RiskLevel } from "./common.model";
import type { ModerationVerdict } from "./moderation.model";

/** The five classes emitted by the NSFW Inception model. */
export type NsfwCategory = "drawings" | "hentai" | "neutral" | "porn" | "sexy";

export const NSFW_CATEGORIES: NsfwCategory[] = [
  "drawings",
  "hentai",
  "neutral",
  "porn",
  "sexy",
];

/** Classes that count toward the aggregate "unsafe" score. */
export const UNSAFE_CATEGORIES: NsfwCategory[] = ["porn", "hentai", "sexy"];

export const NSFW_LABELS: Record<NsfwCategory, string> = {
  drawings: "Drawings",
  hentai: "Hentai",
  neutral: "Neutral",
  porn: "Explicit",
  sexy: "Suggestive",
};

export interface NsfwScore {
  category: NsfwCategory;
  label: string;
  score: number;
}

/** A single image, or a single decoded video frame, scored by the NSFW model. */
export interface NsfwClassification {
  /** All five classes, sorted by score descending. */
  scores: NsfwScore[];
  topCategory: NsfwCategory;
  topLabel: string;
  /** Combined porn + hentai + sexy probability. */
  unsafeScore: number;
  risk: RiskLevel;
}

/** Full result of `POST /image/predict`: pixels plus OCR'd text. */
export interface ImageAnalysis {
  classification: NsfwClassification;
  textVerdict: ModerationVerdict;
  /** Worst of the visual and textual risk — what the UI headlines. */
  overallRisk: RiskLevel;
  flagged: boolean;
}

/** Full result of `POST /video/analyze_video`: sampled frames plus audio track. */
export interface VideoAnalysis {
  frames: NsfwClassification[];
  frameCount: number;
  /** Mean score per class across every sampled frame. */
  aggregate: NsfwClassification;
  /** Index into `frames` of the highest unsafe score. */
  worstFrameIndex: number;
  /** Frames whose unsafe score crosses the flagging threshold. */
  unsafeFrameCount: number;
  audioVerdict: ModerationVerdict;
  overallRisk: RiskLevel;
  flagged: boolean;
}
