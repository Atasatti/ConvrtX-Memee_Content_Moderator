"use client";

import { ChevronLeft, ChevronRight, Download, History, Search, Trash2, X } from "lucide-react";
import { useCallback, useState } from "react";
import { formatDuration, formatRelativeTime } from "@/lib/utils";
import type { ScanKind } from "@/models/scan.model";
import { SCAN_KIND_LABELS } from "@/models/scan.model";
import { useHistoryViewModel } from "@/viewmodels/useHistoryViewModel";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { EmptyState } from "../components/EmptyState";
import { ErrorAlert } from "../components/ErrorAlert";
import { PageHeader } from "../components/PageHeader";
import { RiskPill } from "../components/RiskPill";
import { SegmentedControl } from "../components/SegmentedControl";

export function HistoryView() {
  const vm = useHistoryViewModel();
  const [confirmingClear, setConfirmingClear] = useState(false);

  const closeClearDialog = useCallback(() => setConfirmingClear(false), []);
  const clearHistory = useCallback(() => {
    vm.clear();
    setConfirmingClear(false);
  }, [vm]);

  return (
    <>
      <PageHeader
        title="Scan history"
        description="Review every moderation decision saved in your local Aegis database."
        actions={
          vm.totalCount > 0 ? (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={vm.exportJson}>
                <Download size={13} aria-hidden />
                Export JSON
              </Button>
              <Button size="sm" variant="danger" onClick={() => setConfirmingClear(true)}>
                <Trash2 size={13} aria-hidden />
                Clear history
              </Button>
            </div>
          ) : null
        }
      />

      {vm.error ? (
        <div className="mb-5">
          <ErrorAlert error={vm.error} onRetry={vm.retry} />
        </div>
      ) : null}

      {vm.error && vm.isEmpty ? null : vm.isEmpty ? (
        <Card>
          <EmptyState
            icon={<History size={24} />}
            title={vm.isLoading ? "Loading history…" : "No scans logged yet"}
            description="Run a scan from any analyzer and its verdict will appear here automatically."
          />
        </Card>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-line/80 bg-surface/70 p-3 backdrop-blur-sm">
            <SegmentedControl
              label="Verdict filter"
              value={vm.filter}
              onChange={vm.setFilter}
              options={[
                { value: "all", label: "All" },
                { value: "flagged", label: "Flagged" },
                { value: "clean", label: "Clean" },
              ]}
            />

            <label className="sr-only" htmlFor="kind-filter">
              Filter by analyzer
            </label>
            <select
              id="kind-filter"
              value={vm.kindFilter}
              onChange={(event) =>
                vm.setKindFilter(event.target.value as ScanKind | "all")
              }
              className="min-h-10 rounded-xl border border-line bg-raised/80 px-3 py-2 text-xs text-ink-2 focus:border-brand focus:outline-none"
            >
              <option value="all">All analyzers</option>
              {(Object.keys(SCAN_KIND_LABELS) as ScanKind[]).map((kind) => (
                <option key={kind} value={kind}>
                  {SCAN_KIND_LABELS[kind]}
                </option>
              ))}
            </select>

            <div className="relative min-w-[12rem] flex-1 basis-64">
              <Search
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                aria-hidden
              />
              <label className="sr-only" htmlFor="history-search">
                Search scans
              </label>
              <input
                id="history-search"
                type="search"
                value={vm.query}
                onChange={(event) => vm.setQuery(event.target.value)}
                placeholder="Search subject or summary…"
                className="min-h-10 w-full rounded-xl border border-line bg-raised/80 py-2 pl-9 pr-3 text-xs text-ink placeholder:text-muted focus:border-brand focus:outline-none"
              />
            </div>

            {vm.hasActiveFilters ? (
              <Button size="sm" variant="ghost" onClick={vm.resetFilters}>
                <X size={13} aria-hidden />
                Reset
              </Button>
            ) : null}
          </div>

          <Card>
            {vm.records.length === 0 ? (
              <EmptyState
                icon={<Search size={24} />}
                title="No matching scans"
                description="No records match these filters. Try a broader search."
                action={
                  <Button size="sm" onClick={vm.resetFilters}>
                    Reset filters
                  </Button>
                }
              />
            ) : (
              <>
                <ul className="divide-y divide-line/80 md:hidden">
                  {vm.records.map((record) => (
                    <li key={record.id} className="px-4 py-4">
                      <div className="flex min-w-0 items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-ink" title={record.subject}>
                            {record.subject}
                          </p>
                          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">
                            {record.summary}
                          </p>
                        </div>
                        <RiskPill risk={record.risk} className="shrink-0" />
                      </div>

                      <div className="mt-3 flex items-center gap-2 text-[11px] text-muted">
                        <span>{SCAN_KIND_LABELS[record.kind]}</span>
                        <span aria-hidden>·</span>
                        <span className="tabular">{formatDuration(record.durationMs)}</span>
                        <span aria-hidden>·</span>
                        <span>{formatRelativeTime(record.createdAt)}</span>
                        <button
                          type="button"
                          onClick={() => vm.remove(record.id)}
                          aria-label={`Delete scan of ${record.subject}`}
                          className="ml-auto rounded-lg p-2 text-muted transition-colors hover:bg-critical/10 hover:text-critical focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[42rem] text-left text-sm">
                    <thead className="bg-raised/35">
                      <tr className="border-b border-line text-[10px] uppercase tracking-[0.12em] text-muted">
                        <th scope="col" className="px-5 py-3 font-medium">Subject</th>
                        <th scope="col" className="px-3 py-3 font-medium">Analyzer</th>
                        <th scope="col" className="px-3 py-3 font-medium">Risk</th>
                        <th scope="col" className="px-3 py-3 text-right font-medium">Time</th>
                        <th scope="col" className="px-3 py-3 text-right font-medium">When</th>
                        <th scope="col" className="px-5 py-3"><span className="sr-only">Actions</span></th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-line/80">
                      {vm.records.map((record) => (
                        <tr key={record.id} className="transition-colors hover:bg-raised/35">
                          <td className="max-w-xs px-5 py-3.5">
                            <p className="truncate font-medium text-ink" title={record.subject}>
                              {record.subject}
                            </p>
                            <p className="truncate text-xs text-muted" title={record.summary}>
                              {record.summary}
                            </p>
                          </td>
                          <td className="px-3 py-3.5 text-xs text-ink-2">{SCAN_KIND_LABELS[record.kind]}</td>
                          <td className="px-3 py-3.5"><RiskPill risk={record.risk} /></td>
                          <td className="tabular px-3 py-3.5 text-right text-xs text-muted">{formatDuration(record.durationMs)}</td>
                          <td className="px-3 py-3.5 text-right text-xs text-muted">{formatRelativeTime(record.createdAt)}</td>
                          <td className="px-5 py-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => vm.remove(record.id)}
                              aria-label={`Delete scan of ${record.subject}`}
                              className="rounded-lg p-2 text-muted transition-colors hover:bg-critical/10 hover:text-critical focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </Card>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted">
              {vm.filteredCount > 0
                ? `Showing ${vm.pageStart + 1}–${vm.pageEnd} of ${vm.filteredCount}`
                : "No matching records"}
              {vm.filteredCount !== vm.totalCount ? ` · ${vm.totalCount} total` : ""}
            </p>

            {vm.totalPages > 1 ? (
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={vm.previousPage} disabled={vm.currentPage === 1} aria-label="Previous history page">
                  <ChevronLeft size={14} aria-hidden />
                </Button>
                <span className="tabular px-1 text-xs text-muted">
                  Page {vm.currentPage} of {vm.totalPages}
                </span>
                <Button size="sm" onClick={vm.nextPage} disabled={vm.currentPage === vm.totalPages} aria-label="Next history page">
                  <ChevronRight size={14} aria-hidden />
                </Button>
              </div>
            ) : null}
          </div>
        </>
      )}

      <ConfirmDialog
        open={confirmingClear}
        title="Clear all scan history?"
        description={`This permanently deletes ${vm.totalCount} records from the local Aegis database. This action cannot be undone.`}
        confirmLabel="Clear history"
        onCancel={closeClearDialog}
        onConfirm={clearHistory}
      />
    </>
  );
}
