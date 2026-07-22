"use client";

import Link from "next/link";
import { Activity, ArrowRight, ShieldAlert, ShieldCheck, Timer } from "lucide-react";
import { formatDuration, formatPercent, formatRelativeTime } from "@/lib/utils";
import { SCAN_KIND_LABELS } from "@/models/scan.model";
import { useDashboardViewModel } from "@/viewmodels/useDashboardViewModel";
import { Card, CardBody, CardHeader } from "../components/Card";
import { EmptyState } from "../components/EmptyState";
import { ErrorAlert } from "../components/ErrorAlert";
import { PageHeader } from "../components/PageHeader";
import { RiskPill } from "../components/RiskPill";
import { StatTile } from "../components/StatTile";
import { NAV_ITEMS } from "../shell/navigation";

export function DashboardView() {
  const vm = useDashboardViewModel();
  const analyzers = NAV_ITEMS.filter(
    (item) => item.href !== "/" && item.href !== "/history",
  );

  return (
    <>
      <PageHeader
        title="Moderation overview"
        description="Monitor content decisions, review recent risk signals, and launch a new analysis from one focused workspace."
      />

      {vm.historyError ? (
        <div className="mb-5">
          <ErrorAlert error={vm.historyError} onRetry={vm.retryHistory} />
        </div>
      ) : null}

      {!vm.api.isOnline && vm.api.status !== "checking" ? (
        <div
          role="alert"
          className="mb-5 rounded-xl border border-critical/40 bg-critical/10 px-4 py-3.5"
        >
          <p className="text-sm font-medium text-critical">
            Cannot reach the moderation API
          </p>
          <p className="mt-1 text-xs leading-relaxed text-ink-2">
            {vm.api.message ?? "The backend did not respond."} Start it with{" "}
            <code className="rounded bg-canvas px-1.5 py-0.5">python main.py</code> from
            the <code className="rounded bg-canvas px-1.5 py-0.5">backend/</code>{" "}
            directory, then retry.
          </p>
          <p className="mt-1 text-[11px] text-muted">Expected at {vm.api.baseUrl}</p>
        </div>
      ) : null}

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Total scans"
          value={String(vm.stats.total)}
          hint="Saved locally"
          icon={<Activity size={15} />}
        />
        <StatTile
          label="Flagged"
          value={String(vm.stats.flagged)}
          hint={vm.stats.total > 0 ? formatPercent(vm.stats.flaggedRate, 0) : undefined}
          tone={vm.stats.flagged > 0 ? "critical" : "default"}
          icon={<ShieldAlert size={15} />}
        />
        <StatTile
          label="Clean"
          value={String(vm.stats.clean)}
          tone={vm.stats.clean > 0 ? "good" : "default"}
          icon={<ShieldCheck size={15} />}
        />
        <StatTile
          label="Avg. scan time"
          value={vm.averageDurationMs > 0 ? formatDuration(vm.averageDurationMs) : "—"}
          hint="Last few scans"
          icon={<Timer size={15} />}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <Card>
          <CardHeader
            title="Recent scans"
            description="Latest decisions across every analyzer."
            actions={
              vm.hasScans ? (
                <Link
                  href="/history"
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-brand-bright transition-colors hover:bg-brand/10 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  View all
                  <ArrowRight size={13} aria-hidden />
                </Link>
              ) : null
            }
          />

          {vm.hasScans ? (
            <ul className="divide-y divide-line">
              {vm.stats.recent.map((record) => (
                <li
                  key={record.id}
                  className="flex min-w-0 items-center gap-3 px-4 py-3.5 transition-colors hover:bg-raised/35 sm:px-5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink" title={record.subject}>
                      {record.subject}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {SCAN_KIND_LABELS[record.kind]} · {record.summary}
                    </p>
                  </div>
                  <RiskPill risk={record.risk} />
                  <span className="tabular hidden w-16 shrink-0 text-right text-[11px] text-muted sm:block">
                    {formatRelativeTime(record.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={<Activity size={26} />}
              title={vm.isLoading ? "Loading…" : "No scans yet"}
              description="Pick an analyzer to run your first scan. Results are logged here automatically."
            />
          )}
        </Card>

        <div className="flex flex-col gap-5">
          <Card>
            <CardHeader title="Start a scan" description="Choose a content format." />
            <CardBody className="flex flex-col gap-2 px-3 py-3">
              {analyzers.map((item, index) => {
                const Icon = item.icon;
                const count = vm.analyzerUsage.find(
                  (usage) => `/${usage.kind}` === item.href,
                )?.count;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group flex items-center gap-3 rounded-xl border border-transparent px-2.5 py-2.5 transition-all hover:border-line hover:bg-raised/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                  >
                    <span
                      className={
                        index === 0
                          ? "grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand/12 text-brand-bright"
                          : "grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent/8 text-accent"
                      }
                    >
                      <Icon size={16} aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-ink">
                        {item.label}
                      </span>
                      <span className="block truncate text-[11px] text-muted">
                        {item.description}
                      </span>
                    </span>
                    {count ? (
                      <span className="tabular rounded-full bg-raised px-2 py-0.5 text-[10px] text-muted">
                        {count}
                      </span>
                    ) : null}
                    <ArrowRight
                      size={14}
                      className="shrink-0 text-muted opacity-0 transition-opacity group-hover:opacity-100"
                      aria-hidden
                    />
                  </Link>
                );
              })}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="System status" description="Local moderation service." />
            <CardBody className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between gap-3 rounded-xl bg-raised/55 px-3 py-2.5">
                <span className="text-muted">Endpoint</span>
                <code className="truncate text-ink-2">{vm.api.baseUrl}</code>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl bg-raised/55 px-3 py-2.5">
                <span className="text-muted">Status</span>
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <span
                    className={
                      vm.api.isOnline
                        ? "h-1.5 w-1.5 rounded-full bg-good shadow-[0_0_10px_var(--color-good)]"
                        : "h-1.5 w-1.5 rounded-full bg-critical"
                    }
                  />
                  <span className={vm.api.isOnline ? "text-good" : "text-critical"}>
                  {vm.api.status === "checking"
                    ? "Checking…"
                    : vm.api.isOnline
                      ? "Online"
                      : "Offline"}
                  </span>
                </span>
              </div>
              {vm.api.health ? (
                <div className="flex items-center justify-between gap-3 rounded-xl bg-raised/55 px-3 py-2.5">
                  <span className="text-muted">Version</span>
                  <span className="tabular text-ink-2">{vm.api.health.version}</span>
                </div>
              ) : null}
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
