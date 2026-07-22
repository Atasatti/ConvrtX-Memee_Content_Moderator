"use client";

import { useMemo } from "react";
import { SCAN_KIND_LABELS, type ScanKind } from "@/models/scan.model";
import { useApiStatusViewModel } from "./useApiStatusViewModel";
import { useScanHistory } from "./scanHistoryStore";

export interface AnalyzerSummary {
  kind: ScanKind;
  label: string;
  count: number;
}

export function useDashboardViewModel() {
  const { stats, isLoading, error: historyError, retry: retryHistory } = useScanHistory();
  const api = useApiStatusViewModel();

  const analyzerUsage = useMemo<AnalyzerSummary[]>(
    () =>
      (Object.keys(stats.byKind) as ScanKind[])
        .map((kind) => ({
          kind,
          label: SCAN_KIND_LABELS[kind],
          count: stats.byKind[kind],
        }))
        .sort((a, b) => b.count - a.count),
    [stats.byKind],
  );

  const busiestCount = analyzerUsage[0]?.count ?? 0;

  const averageDurationMs = useMemo(() => {
    if (stats.recent.length === 0) return 0;
    const total = stats.recent.reduce((sum, r) => sum + r.durationMs, 0);
    return total / stats.recent.length;
  }, [stats.recent]);

  return {
    stats,
    isLoading,
    historyError,
    retryHistory,
    analyzerUsage,
    busiestCount,
    averageDurationMs,
    api,
    hasScans: stats.total > 0,
  };
}

export type DashboardViewModel = ReturnType<typeof useDashboardViewModel>;
