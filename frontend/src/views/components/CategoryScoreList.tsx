"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { CategoryScore } from "@/models/moderation.model";
import { isEmphasized } from "../theme/risk";
import { ScoreBar } from "./ScoreBar";

interface CategoryScoreListProps {
  categories: CategoryScore[];
  dominantCategory: string | null;
}

/** How many rows to show before collapsing the long tail of near-zero scores. */
const VISIBLE_COUNT = 6;

/**
 * The moderation categories, as a table with magnitude bars — the right form for
 * ~13 classes that all carry meaning. Near-zero rows are folded away by default
 * so the findings are not buried in noise.
 */
export function CategoryScoreList({
  categories,
  dominantCategory,
}: CategoryScoreListProps) {
  const [expanded, setExpanded] = useState(false);

  if (categories.length === 0) {
    return <p className="text-xs text-muted">No category scores were returned.</p>;
  }

  // Always show findings, even if they'd fall outside the default window.
  const findings = categories.filter((c) => isEmphasized(c.risk));
  const minimum = Math.max(VISIBLE_COUNT, findings.length);
  const visible = expanded ? categories : categories.slice(0, minimum);
  const hiddenCount = categories.length - visible.length;

  return (
    <div>
      <div className="divide-y divide-line/60">
        {visible.map((category) => (
          <ScoreBar
            key={category.id}
            label={category.label}
            score={category.score}
            risk={category.risk}
            isDominant={category.id === dominantCategory}
          />
        ))}
      </div>

      {hiddenCount > 0 || expanded ? (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-3 inline-flex items-center gap-1.5 rounded text-xs text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <ChevronDown
            size={13}
            className={expanded ? "rotate-180 transition-transform" : "transition-transform"}
            aria-hidden
          />
          {expanded ? "Show fewer categories" : `Show ${hiddenCount} more categories`}
        </button>
      ) : null}
    </div>
  );
}
