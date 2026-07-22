import { highestRisk, riskLevelFromScore } from "../common.model";
import type {
  CategoryScore,
  ModerationVerdict,
  NumberCheckResult,
} from "../moderation.model";
import { EMPTY_VERDICT } from "../moderation.model";
import type {
  ImageAnalysis,
  NsfwCategory,
  NsfwClassification,
  NsfwScore,
  VideoAnalysis,
} from "../nsfw.model";
import { NSFW_CATEGORIES, NSFW_LABELS, UNSAFE_CATEGORIES } from "../nsfw.model";
import type {
  ImagePredictResponseDto,
  ModerationResponseDto,
  NumberCheckResponseDto,
  VideoAnalyzeResponseDto,
} from "./api.dto";

/** Score at or above which a frame counts as unsafe — matches the backend's flag threshold. */
const UNSAFE_FRAME_THRESHOLD = 0.75;

const CATEGORY_LABELS: Record<string, string> = {
  harassment: "Harassment",
  harassment_threatening: "Harassment (threatening)",
  hate: "Hate",
  hate_threatening: "Hate (threatening)",
  illicit: "Illicit",
  illicit_violent: "Illicit (violent)",
  self_harm: "Self-harm",
  self_harm_instructions: "Self-harm (instructions)",
  self_harm_intent: "Self-harm (intent)",
  sexual: "Sexual",
  sexual_minors: "Sexual (minors)",
  violence: "Violence",
  violence_graphic: "Violence (graphic)",
};

/**
 * OpenAI returns the same category under two spellings — `self_harm/intent` and
 * `self_harm_intent`. Collapse them onto one key so the UI shows each category once.
 */
function normalizeCategoryKey(key: string): string {
  return key.trim().toLowerCase().replace(/[/\-\s]+/g, "_");
}

function labelForCategory(key: string): string {
  const normalized = normalizeCategoryKey(key);
  if (CATEGORY_LABELS[normalized]) return CATEGORY_LABELS[normalized];
  const words = normalized.split("_").filter(Boolean);
  if (words.length === 0) return "Unknown";
  return words[0].charAt(0).toUpperCase() + words[0].slice(1) + (words.length > 1 ? ` (${words.slice(1).join(" ")})` : "");
}

function toFiniteScore(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

function toStringList(value: unknown[] | null | undefined): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item : String(item ?? "")))
    .map((s) => s.trim())
    .filter(Boolean);
}

function mapCategoryScores(
  raw: Record<string, number> | number[] | null | undefined,
): CategoryScore[] {
  if (!raw) return [];

  // Some error paths return a bare array; there are no names to attach, so index it.
  const entries: [string, number][] = Array.isArray(raw)
    ? raw.map((score, i) => [`category_${i}`, toFiniteScore(score)])
    : Object.entries(raw).map(([key, score]) => [key, toFiniteScore(score)]);

  const deduped = new Map<string, number>();
  for (const [key, score] of entries) {
    const id = normalizeCategoryKey(key);
    const existing = deduped.get(id);
    if (existing === undefined || score > existing) deduped.set(id, score);
  }

  return Array.from(deduped, ([id, score]) => ({
    id,
    label: labelForCategory(id),
    score,
    risk: riskLevelFromScore(score),
  })).sort((a, b) => b.score - a.score);
}

/** Maps any of the four endpoints that return the shared moderation shape. */
export function toModerationVerdict(
  dto: ModerationResponseDto | null | undefined,
): ModerationVerdict {
  if (!dto) return EMPTY_VERDICT;

  const categories = mapCategoryScores(dto.category_scores);
  const detectedNumbers = toStringList(dto.numbers);
  const top = categories[0] ?? null;

  // The backend spells this `flagged` on most routes and `flag` on older ones.
  const flaggedByApi = dto.flagged ?? dto.flag ?? false;
  const flagged = Boolean(flaggedByApi) || detectedNumbers.length > 0;

  // `type` names the dominant category; fall back to the highest score we mapped.
  const dominantCategory = dto.type ? normalizeCategoryKey(dto.type) : top?.id ?? null;

  return {
    flagged,
    dominantCategory,
    dominantLabel: dominantCategory ? labelForCategory(dominantCategory) : null,
    topScore: top?.score ?? 0,
    risk: flagged
      ? highestRisk([riskLevelFromScore(top?.score ?? 0), "high"])
      : riskLevelFromScore(top?.score ?? 0),
    categories,
    detectedNumbers,
    extractedText: typeof dto.extracted_text === "string" ? dto.extracted_text.trim() : "",
  };
}

export function toNumberCheckResult(
  dto: NumberCheckResponseDto | null | undefined,
): NumberCheckResult {
  const numbers = toStringList(dto?.numbers);
  return { flagged: Boolean(dto?.flagged) || numbers.length > 0, numbers };
}

function isNsfwCategory(value: string): value is NsfwCategory {
  return (NSFW_CATEGORIES as string[]).includes(value);
}

export function toNsfwClassification(
  predictions: Record<string, number> | null | undefined,
  topCategoryHint?: string | null,
): NsfwClassification {
  const scores: NsfwScore[] = NSFW_CATEGORIES.map((category) => ({
    category,
    label: NSFW_LABELS[category],
    score: toFiniteScore(predictions?.[category]),
  })).sort((a, b) => b.score - a.score);

  const hint = topCategoryHint?.toLowerCase() ?? "";
  const topCategory =
    hint && isNsfwCategory(hint) ? hint : scores[0]?.category ?? "neutral";

  const unsafeScore = scores
    .filter((s) => UNSAFE_CATEGORIES.includes(s.category))
    .reduce((sum, s) => sum + s.score, 0);
  const clampedUnsafe = Math.min(1, unsafeScore);

  return {
    scores,
    topCategory,
    topLabel: NSFW_LABELS[topCategory],
    unsafeScore: clampedUnsafe,
    risk: riskLevelFromScore(clampedUnsafe),
  };
}

export function toImageAnalysis(dto: ImagePredictResponseDto): ImageAnalysis {
  const classification = toNsfwClassification(
    dto.image_classification?.predictions,
    dto.image_classification?.top_category,
  );
  const textVerdict = toModerationVerdict(dto.text_analysis);

  return {
    classification,
    textVerdict,
    overallRisk: highestRisk([classification.risk, textVerdict.risk]),
    flagged: classification.unsafeScore >= UNSAFE_FRAME_THRESHOLD || textVerdict.flagged,
  };
}

/** Averages per-class scores across sampled frames into one representative classification. */
function averageFrames(frames: NsfwClassification[]): NsfwClassification {
  if (frames.length === 0) return toNsfwClassification(null);

  const totals: Record<string, number> = {};
  for (const frame of frames) {
    for (const score of frame.scores) {
      totals[score.category] = (totals[score.category] ?? 0) + score.score;
    }
  }
  for (const key of Object.keys(totals)) totals[key] /= frames.length;

  return toNsfwClassification(totals);
}

export function toVideoAnalysis(dto: VideoAnalyzeResponseDto): VideoAnalysis {
  const rawFrames = dto.Frames_classification?.predictions ?? [];
  const hints = dto.Frames_classification?.top_categories ?? [];

  const frames = rawFrames.map((prediction, i) =>
    toNsfwClassification(prediction, hints[i]),
  );

  const aggregate = averageFrames(frames);
  const audioVerdict = toModerationVerdict(dto.Audio_analysis);

  let worstFrameIndex = -1;
  let worstScore = -1;
  frames.forEach((frame, i) => {
    if (frame.unsafeScore > worstScore) {
      worstScore = frame.unsafeScore;
      worstFrameIndex = i;
    }
  });

  const unsafeFrameCount = frames.filter(
    (f) => f.unsafeScore >= UNSAFE_FRAME_THRESHOLD,
  ).length;

  // A video is only as safe as its worst frame, so headline the peak, not the mean.
  const peakRisk = riskLevelFromScore(worstScore < 0 ? 0 : worstScore);

  return {
    frames,
    frameCount: dto.Frames_classification?.frame_count ?? frames.length,
    aggregate,
    worstFrameIndex,
    unsafeFrameCount,
    audioVerdict,
    overallRisk: highestRisk([peakRisk, audioVerdict.risk]),
    flagged: unsafeFrameCount > 0 || audioVerdict.flagged,
  };
}
