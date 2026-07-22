"use client";

import { useCallback, useMemo, useState } from "react";
import type { RiskLevel } from "@/models/common.model";
import type { ScanKind, ScanRecord } from "@/models/scan.model";
import { useScanHistory } from "./scanHistoryStore";

export type HistoryFilter = "all" | "flagged" | "clean";
const PAGE_SIZE = 10;

export function useHistoryViewModel() {
  const { records, stats, isLoading, error, remove, clear, retry } = useScanHistory();

  const [filter, setFilter] = useState<HistoryFilter>("all");
  const [kindFilter, setKindFilter] = useState<ScanKind | "all">("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return records.filter((record) => {
      if (filter === "flagged" && !record.flagged) return false;
      if (filter === "clean" && record.flagged) return false;
      if (kindFilter !== "all" && record.kind !== kindFilter) return false;
      if (
        needle &&
        !record.subject.toLowerCase().includes(needle) &&
        !record.summary.toLowerCase().includes(needle)
      ) {
        return false;
      }
      return true;
    });
  }, [records, filter, kindFilter, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const visible = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  const riskBreakdown = useMemo(() => {
    const counts: Record<RiskLevel, number> = {
      safe: 0,
      low: 0,
      elevated: 0,
      high: 0,
      critical: 0,
    };
    for (const record of records) counts[record.risk] += 1;
    return counts;
  }, [records]);

  const exportJson = useCallback(() => {
    const blob = new Blob([JSON.stringify(records, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `aegis-scan-history-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [records]);

  const resetFilters = useCallback(() => {
    setFilter("all");
    setKindFilter("all");
    setQuery("");
    setPage(1);
  }, []);

  const changeFilter = useCallback((next: HistoryFilter) => {
    setFilter(next);
    setPage(1);
  }, []);

  const changeKindFilter = useCallback((next: ScanKind | "all") => {
    setKindFilter(next);
    setPage(1);
  }, []);

  const changeQuery = useCallback((next: string) => {
    setQuery(next);
    setPage(1);
  }, []);

  const hasActiveFilters = filter !== "all" || kindFilter !== "all" || query.trim() !== "";

  return {
    records: visible as ScanRecord[],
    totalCount: records.length,
    filteredCount: filtered.length,
    stats,
    riskBreakdown,
    isLoading,
    error,
    isEmpty: records.length === 0,

    filter,
    setFilter: changeFilter,
    kindFilter,
    setKindFilter: changeKindFilter,
    query,
    setQuery: changeQuery,
    hasActiveFilters,
    resetFilters,

    remove,
    clear,
    retry,
    exportJson,

    currentPage,
    totalPages,
    pageStart,
    pageEnd: Math.min(pageStart + PAGE_SIZE, filtered.length),
    previousPage: () => setPage((current) => Math.max(1, current - 1)),
    nextPage: () => setPage((current) => Math.min(totalPages, current + 1)),
  };
}

export type HistoryViewModel = ReturnType<typeof useHistoryViewModel>;
