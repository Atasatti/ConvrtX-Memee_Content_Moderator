import type { RiskLevel } from "@/models/common.model";

/**
 * Maps the five risk bands onto the four reserved status colors. `safe` and
 * `low` share the "good" step — they are told apart by their label, never by
 * hue alone, which is the rule status colors always follow here.
 */
export interface RiskPresentation {
  label: string;
  /** CSS color for marks (bars, dots). */
  color: string;
  /** Tailwind classes for a filled badge. */
  badge: string;
  /** Tailwind class for text in the status color. */
  text: string;
}

export const RISK_PRESENTATION: Record<RiskLevel, RiskPresentation> = {
  safe: {
    label: "Safe",
    color: "var(--color-good)",
    badge: "bg-good/15 text-good border-good/40",
    text: "text-good",
  },
  low: {
    label: "Low",
    color: "var(--color-good)",
    badge: "bg-good/10 text-good border-good/30",
    text: "text-good",
  },
  elevated: {
    label: "Elevated",
    color: "var(--color-warning)",
    badge: "bg-warning/15 text-warning border-warning/40",
    text: "text-warning",
  },
  high: {
    label: "High",
    color: "var(--color-serious)",
    badge: "bg-serious/15 text-serious border-serious/40",
    text: "text-serious",
  },
  critical: {
    label: "Critical",
    color: "var(--color-critical)",
    badge: "bg-critical/20 text-critical border-critical/50",
    text: "text-critical",
  },
};

/** Below this, a score is context rather than a finding, and stays in the sequential hue. */
export const EMPHASIS_THRESHOLD: RiskLevel[] = ["elevated", "high", "critical"];

export function isEmphasized(risk: RiskLevel): boolean {
  return EMPHASIS_THRESHOLD.includes(risk);
}

/**
 * Bar fill for a score. Findings take their status color; everything else stays
 * in the recessive sequential violet so the eye lands on what matters.
 */
export function barColor(risk: RiskLevel): string {
  return isEmphasized(risk) ? RISK_PRESENTATION[risk].color : "var(--color-brand-dim)";
}
