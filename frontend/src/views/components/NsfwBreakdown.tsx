import { riskLevelFromScore } from "@/models/common.model";
import type { NsfwClassification } from "@/models/nsfw.model";
import { UNSAFE_CATEGORIES } from "@/models/nsfw.model";
import { formatPercent } from "@/lib/utils";
import { RiskPill } from "./RiskPill";
import { ScoreBar } from "./ScoreBar";

interface NsfwBreakdownProps {
  classification: NsfwClassification;
  /** Hidden when the caller already headlines the aggregate elsewhere. */
  showSummary?: boolean;
}

/**
 * The five NSFW classes as a magnitude table. Unsafe classes are scored against
 * the risk bands; the neutral and drawing classes stay recessive because a high
 * score there is a *good* outcome and should not read as a finding.
 */
export function NsfwBreakdown({
  classification,
  showSummary = true,
}: NsfwBreakdownProps) {
  return (
    <div>
      {showSummary ? (
        <div className="mb-3 flex items-center justify-between gap-3 border-b border-line pb-3">
          <div>
            <p className="text-xs text-muted">Combined unsafe probability</p>
            <p className="tabular mt-0.5 text-2xl font-semibold text-ink">
              {formatPercent(classification.unsafeScore, 1)}
            </p>
          </div>
          <RiskPill risk={classification.risk} />
        </div>
      ) : null}

      <div className="divide-y divide-line/60">
        {classification.scores.map((score) => {
          const counts = UNSAFE_CATEGORIES.includes(score.category);
          return (
            <ScoreBar
              key={score.category}
              label={score.label}
              score={score.score}
              risk={counts ? riskLevelFromScore(score.score) : "safe"}
              isDominant={score.category === classification.topCategory}
            />
          );
        })}
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-muted">
        Unsafe probability sums the Explicit, Hentai, and Suggestive classes.
      </p>
    </div>
  );
}
