"use client";

import { Loader2, Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApiStatusViewModel } from "@/viewmodels/useApiStatusViewModel";

/** Surfaces backend reachability, since every analyzer depends on it. */
export function ApiStatusBadge({ compact = false }: { compact?: boolean }) {
  const { status, health, message, baseUrl, refresh } = useApiStatusViewModel();

  const config = {
    checking: {
      icon: <Loader2 size={13} className="animate-spin" aria-hidden />,
      text: compact ? "Checking" : "Checking API",
      className: "border-line text-muted",
    },
    online: {
      icon: <Wifi size={13} aria-hidden />,
      text: compact ? "Online" : `API online${health?.version ? ` · v${health.version}` : ""}`,
      className: "border-good/40 bg-good/10 text-good",
    },
    offline: {
      icon: <WifiOff size={13} aria-hidden />,
      text: compact ? "Offline" : "API offline",
      className: "border-critical/40 bg-critical/10 text-critical",
    },
  }[status];

  return (
    <button
      type="button"
      onClick={() => void refresh()}
      title={message ? `${message}\n${baseUrl}` : baseUrl}
      aria-label={`${config.text}. Refresh API status.`}
      className={cn(
        "inline-flex min-h-8 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
        "hover:-translate-y-px",
        config.className,
      )}
    >
      {config.icon}
      {config.text}
    </button>
  );
}
