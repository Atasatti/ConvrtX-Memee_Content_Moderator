import { AlertCircle } from "lucide-react";
import type { AppError } from "@/models/common.model";
import { Button } from "./Button";

interface ErrorAlertProps {
  error: AppError;
  onRetry?: () => void;
}

export function ErrorAlert({ error, onRetry }: ErrorAlertProps) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-2xl border border-critical/35 bg-critical/10 px-4 py-3.5 shadow-[0_18px_45px_-34px_rgba(241,98,112,0.65)]"
    >
      <AlertCircle size={18} className="mt-0.5 shrink-0 text-critical" aria-hidden />

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-critical">{error.message}</p>
        {error.detail ? (
          <p className="mt-1 text-xs leading-relaxed text-ink-2">{error.detail}</p>
        ) : null}
        {error.status ? (
          <p className="tabular mt-1 text-[11px] text-muted">HTTP {error.status}</p>
        ) : null}
      </div>

      {onRetry ? (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Retry
        </Button>
      ) : null}
    </div>
  );
}
