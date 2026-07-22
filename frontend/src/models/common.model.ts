/**
 * Shared domain vocabulary. Pure TypeScript — no React, no fetch.
 */

export type RiskLevel = "safe" | "low" | "elevated" | "high" | "critical";

/**
 * The backend flags a moderation category once its score exceeds 0.75
 * (see `analyze_text` in backend/app/services/moderation_service.py). The bands
 * below keep the UI consistent with that decision boundary: `critical` starts
 * exactly where the backend starts flagging.
 */
export const RISK_THRESHOLDS: ReadonlyArray<{ level: RiskLevel; min: number }> = [
  { level: "critical", min: 0.75 },
  { level: "high", min: 0.5 },
  { level: "elevated", min: 0.25 },
  { level: "low", min: 0.05 },
  { level: "safe", min: 0 },
];

export function riskLevelFromScore(score: number): RiskLevel {
  const band = RISK_THRESHOLDS.find((b) => score >= b.min);
  return band ? band.level : "safe";
}

export const RISK_ORDER: Record<RiskLevel, number> = {
  safe: 0,
  low: 1,
  elevated: 2,
  high: 3,
  critical: 4,
};

export function highestRisk(levels: RiskLevel[]): RiskLevel {
  return levels.reduce<RiskLevel>(
    (worst, level) => (RISK_ORDER[level] > RISK_ORDER[worst] ? level : worst),
    "safe",
  );
}

/** A normalized failure surfaced to ViewModels. Never thrown past the service layer. */
export interface AppError {
  message: string;
  status?: number;
  detail?: string;
}

/** Discriminated result so ViewModels branch without try/catch. */
export type Result<T> = { ok: true; value: T } | { ok: false; error: AppError };

export const Ok = <T>(value: T): Result<T> => ({ ok: true, value });
export const Err = <T = never>(error: AppError): Result<T> => ({ ok: false, error });
