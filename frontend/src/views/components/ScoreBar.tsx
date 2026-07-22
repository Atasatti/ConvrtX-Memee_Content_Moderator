import { cn, formatPercent } from "@/lib/utils";
import type { RiskLevel } from "@/models/common.model";
import { barColor, isEmphasized } from "../theme/risk";

interface ScoreBarProps {
  label: string;
  score: number;
  risk: RiskLevel;
  /** Marks the row the API named as dominant. */
  isDominant?: boolean;
}

/**
 * One row of a score table: label, magnitude bar, value. Findings take their
 * status color; everything below the finding threshold stays in the recessive
 * sequential violet, so the eye lands on what matters.
 */
export function ScoreBar({ label, score, risk, isDominant = false }: ScoreBarProps) {
  const emphasized = isEmphasized(risk);
  // Keep a hairline of fill visible for non-zero scores that would otherwise vanish.
  const width = score > 0 ? Math.max(score * 100, 1.5) : 0;

  return (
    <div className="group grid grid-cols-[minmax(0,11rem)_1fr_auto] items-center gap-3 py-1.5">
      <span
        className={cn(
          "truncate text-xs",
          emphasized ? "font-medium text-ink" : "text-ink-2",
        )}
        title={label}
      >
        {label}
        {isDominant ? <span className="ml-1.5 text-[10px] text-muted">top</span> : null}
      </span>

      <div
        className="h-2 overflow-hidden rounded-full bg-raised"
        role="img"
        aria-label={`${label}: ${formatPercent(score)}`}
      >
        <div
          className="h-full rounded-full transition-[width] duration-500 ease-out"
          style={{ width: `${width}%`, backgroundColor: barColor(risk) }}
        />
      </div>

      <span
        className={cn(
          "tabular w-14 text-right text-xs",
          emphasized ? "font-semibold text-ink" : "text-muted",
        )}
      >
        {formatPercent(score, score >= 0.01 ? 1 : 2)}
      </span>
    </div>
  );
}
