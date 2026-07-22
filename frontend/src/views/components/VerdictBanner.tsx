import { ShieldCheck, ShieldAlert } from "lucide-react";
import { cn, formatDuration } from "@/lib/utils";
import type { RiskLevel } from "@/models/common.model";
import { RISK_PRESENTATION } from "../theme/risk";

interface VerdictBannerProps {
  flagged: boolean;
  risk: RiskLevel;
  headline: string;
  detail?: string;
  elapsedMs?: number;
}

/**
 * The hero verdict for a completed scan — the one thing the operator reads
 * first. Icon, wording, and color all agree, so it survives a colorblind or
 * grayscale read.
 */
export function VerdictBanner({
  flagged,
  risk,
  headline,
  detail,
  elapsedMs,
}: VerdictBannerProps) {
  const presentation = RISK_PRESENTATION[risk];
  const Icon = flagged ? ShieldAlert : ShieldCheck;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-4 rounded-2xl border px-5 py-5 shadow-[0_20px_55px_-42px_rgba(0,0,0,0.9)]",
        flagged ? presentation.badge : "border-good/40 bg-good/10",
      )}
    >
      <Icon
        size={28}
        className={cn("shrink-0", flagged ? presentation.text : "text-good")}
        aria-hidden
      />

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-base font-semibold tracking-tight",
            flagged ? presentation.text : "text-good",
          )}
        >
          {flagged ? "Flagged" : "Clean"} · {presentation.label} risk
        </p>
        <p className="mt-0.5 text-sm text-ink-2">{headline}</p>
        {detail ? <p className="mt-1 text-xs text-muted">{detail}</p> : null}
      </div>

      {elapsedMs !== undefined ? (
        <span className="tabular shrink-0 text-xs text-muted">
          {formatDuration(elapsedMs)}
        </span>
      ) : null}
    </div>
  );
}
