import { formatPercent } from "@/lib/utils";
import type { ModerationVerdict, NumberCheckResult } from "@/models/moderation.model";
import type { ImageAnalysis, VideoAnalysis } from "@/models/nsfw.model";

/** One-line descriptions written into the scan log. */

export function summarizeVerdict(verdict: ModerationVerdict): string {
  const parts: string[] = [];

  if (verdict.dominantLabel && verdict.topScore > 0) {
    parts.push(`${verdict.dominantLabel} ${formatPercent(verdict.topScore, 0)}`);
  } else if (!verdict.flagged) {
    parts.push("No policy violations");
  }

  if (verdict.detectedNumbers.length > 0) {
    const n = verdict.detectedNumbers.length;
    parts.push(`${n} phone number${n === 1 ? "" : "s"}`);
  }

  return parts.join(" · ") || (verdict.flagged ? "Flagged" : "Clean");
}

export function summarizeNumbers(result: NumberCheckResult): string {
  if (result.numbers.length === 0) return "No phone numbers found";
  const n = result.numbers.length;
  return `${n} phone number${n === 1 ? "" : "s"} found`;
}

export function summarizeImage(analysis: ImageAnalysis): string {
  const parts = [
    `${analysis.classification.topLabel} ${formatPercent(analysis.classification.unsafeScore, 0)} unsafe`,
  ];
  if (analysis.textVerdict.flagged) {
    parts.push(`OCR: ${summarizeVerdict(analysis.textVerdict)}`);
  }
  return parts.join(" · ");
}

export function summarizeVideo(analysis: VideoAnalysis): string {
  const parts = [`${analysis.frameCount} frames scanned`];
  if (analysis.unsafeFrameCount > 0) {
    parts.push(`${analysis.unsafeFrameCount} unsafe`);
  }
  if (analysis.audioVerdict.flagged) {
    parts.push(`audio: ${summarizeVerdict(analysis.audioVerdict)}`);
  }
  return parts.join(" · ");
}
