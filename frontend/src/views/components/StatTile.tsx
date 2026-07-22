import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatTileProps {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
  /** Tints the value — reserve for genuine status, not decoration. */
  tone?: "default" | "good" | "critical";
}

const TONES = {
  default: "text-ink",
  good: "text-good",
  critical: "text-critical",
} as const;

const ICON_TONES = {
  default: "bg-brand/12 text-brand-bright ring-brand/20",
  good: "bg-good/10 text-good ring-good/20",
  critical: "bg-critical/10 text-critical ring-critical/20",
} as const;

/**
 * A single headline number. This is the right form for one current value —
 * deliberately not a one-bar chart.
 */
export function StatTile({ label, value, hint, icon, tone = "default" }: StatTileProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-line/90 bg-surface/90 px-4 py-4 shadow-[0_20px_55px_-42px_rgba(0,0,0,0.9)]">
      <div className="pointer-events-none absolute -right-7 -top-8 h-24 w-24 rounded-full bg-brand/5 blur-2xl" />
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted">
          {label}
        </p>
        {icon ? (
          <span
            className={cn(
              "grid h-8 w-8 place-items-center rounded-lg ring-1",
              ICON_TONES[tone],
            )}
          >
            {icon}
          </span>
        ) : null}
      </div>
      <p className={cn("mt-2 text-3xl font-semibold tracking-[-0.04em]", TONES[tone])}>
        {value}
      </p>
      {hint ? <p className="mt-0.5 text-[11px] text-muted">{hint}</p> : null}
    </div>
  );
}
