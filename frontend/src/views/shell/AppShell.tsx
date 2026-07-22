"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { AegisLogo } from "./AegisLogo";
import { ApiStatusBadge } from "./ApiStatusBadge";
import { NAV_ITEMS } from "./navigation";

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0.5" aria-label="Analyzers">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group flex items-center gap-3 rounded-xl border px-2.5 py-2.5 transition-all",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
              active
                ? "border-brand/25 bg-brand/10 text-ink shadow-[0_10px_30px_-18px_rgba(124,108,242,0.8)]"
                : "border-transparent text-ink-2 hover:border-line hover:bg-raised/70 hover:text-ink",
            )}
          >
            <span
              className={cn(
                "grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-colors",
                active ? "bg-brand text-white" : "bg-raised text-muted group-hover:text-ink-2",
              )}
            >
              <Icon size={15} aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium">{item.label}</span>
              <span className="block text-[11px] leading-tight text-muted">
                {item.description}
              </span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

function Wordmark() {
  return (
    <Link
      href="/"
      className="flex min-w-0 items-center gap-3 rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      <AegisLogo size={36} className="shrink-0" />
      <span className="min-w-0">
        <span className="block text-base font-semibold tracking-[-0.02em] text-ink">
          Aegis
        </span>
        <span className="hidden text-[9px] font-medium uppercase tracking-[0.18em] text-muted sm:block">
          AI safety console
        </span>
      </span>
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[17rem_1fr]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-line/80 bg-surface/80 px-4 py-5 shadow-[20px_0_60px_-45px_rgba(0,0,0,0.9)] backdrop-blur-xl lg:flex">
        <Wordmark />
        <div className="mt-8 flex-1 overflow-y-auto">
          <NavLinks />
        </div>
        <div className="border-t border-line pt-4">
          <ApiStatusBadge />
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-line/80 bg-canvas/85 px-4 py-3 backdrop-blur-xl lg:hidden">
          <Wordmark />
          <div className="flex items-center gap-2">
            <ApiStatusBadge compact />
            <button
              type="button"
              onClick={() => setMobileOpen((open) => !open)}
              aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={mobileOpen}
              className="grid h-9 w-9 place-items-center rounded-xl border border-line bg-raised text-ink-2 transition-colors hover:border-brand/50 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              {mobileOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </header>

        {mobileOpen ? (
          <div className="border-b border-line bg-surface/95 px-4 py-3 shadow-2xl backdrop-blur-xl lg:hidden">
            <NavLinks onNavigate={() => setMobileOpen(false)} />
          </div>
        ) : null}

        <main className="min-w-0 flex-1 px-4 py-7 sm:px-7 lg:px-10 lg:py-10">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
