"use client";

import { useState } from "react";
import { cn, formatPercent } from "@/lib/utils";
import type { NsfwClassification } from "@/models/nsfw.model";
import { barColor, isEmphasized } from "../theme/risk";

interface FrameTimelineProps {
  frames: NsfwClassification[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

/**
 * Unsafe probability per sampled frame, over time. The backend samples roughly
 * one frame per second, so the column index doubles as a timestamp.
 *
 * Columns are the right form here: the reader's job is to spot which moments
 * spike, not to tell frames apart by identity — so it is one sequential hue,
 * with status color reserved for frames that actually cross the threshold.
 */
export function FrameTimeline({
  frames,
  selectedIndex,
  onSelect,
}: FrameTimelineProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  if (frames.length === 0) {
    return (
      <p className="text-xs text-muted">No frames were sampled from this video.</p>
    );
  }

  const active = hovered ?? selectedIndex;
  const activeFrame = frames[active];

  return (
    <div>
      {/* Readout for the focused column, so values never crowd the marks. */}
      <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="tabular text-2xl font-semibold text-ink">
          {activeFrame ? formatPercent(activeFrame.unsafeScore, 1) : "—"}
        </span>
        <span className="text-xs text-muted">
          unsafe at ~{active}s · {activeFrame?.topLabel ?? "—"}
        </span>
      </div>

      <div
        className="flex items-end gap-[2px] overflow-x-auto pb-2"
        style={{ height: 96 }}
        role="group"
        aria-label="Per-frame unsafe probability"
        onMouseLeave={() => setHovered(null)}
      >
        {frames.map((frame, index) => {
          const isActive = index === active;
          const height = Math.max(frame.unsafeScore * 100, 2);

          return (
            <button
              key={index}
              type="button"
              onMouseEnter={() => setHovered(index)}
              onFocus={() => setHovered(index)}
              onClick={() => onSelect(index)}
              // A 10px hit target around a thin mark, per interaction rules.
              className="group relative flex h-full min-w-[10px] flex-1 items-end rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              title={`~${index}s · ${formatPercent(frame.unsafeScore, 1)} unsafe · ${frame.topLabel}`}
              aria-label={`Frame at ${index} seconds, ${formatPercent(frame.unsafeScore, 1)} unsafe, ${frame.topLabel}`}
              aria-pressed={index === selectedIndex}
            >
              <span
                className={cn(
                  "w-full rounded-t transition-[height,opacity] duration-300",
                  isActive ? "opacity-100" : "opacity-80 group-hover:opacity-100",
                )}
                style={{
                  height: `${height}%`,
                  backgroundColor: barColor(frame.risk),
                  // A 2px surface ring separates the focused column from its neighbours.
                  boxShadow: isActive ? "0 0 0 2px var(--color-surface)" : undefined,
                  outline: isActive ? "1px solid var(--color-ink)" : undefined,
                }}
              />
            </button>
          );
        })}
      </div>

      <div className="mt-1 flex justify-between text-[10px] text-muted">
        <span>0s</span>
        <span>~{frames.length - 1}s</span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: "var(--color-brand-dim)" }}
            aria-hidden
          />
          Below threshold
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: "var(--color-critical)" }}
            aria-hidden
          />
          Flagged frame
        </span>
        <span>
          {frames.filter((f) => isEmphasized(f.risk)).length} of {frames.length} frames
          above the low band
        </span>
      </div>
    </div>
  );
}
