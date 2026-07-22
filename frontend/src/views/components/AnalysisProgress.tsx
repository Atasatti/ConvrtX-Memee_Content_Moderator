import { formatDuration } from "@/lib/utils";

interface AnalysisProgressProps {
  /** Upload completion, 0–100. */
  progress: number;
  elapsedMs: number;
  /** What the server is doing once the bytes are up. */
  processingLabel: string;
}

/**
 * Upload progress is measurable; server-side processing is not, so the bar
 * switches to an indeterminate sweep once the bytes are delivered rather than
 * faking a percentage.
 */
export function AnalysisProgress({
  progress,
  elapsedMs,
  processingLabel,
}: AnalysisProgressProps) {
  const uploading = progress < 100;

  return (
    <div className="rounded-2xl border border-brand/20 bg-brand/5 px-5 py-4 shadow-[0_20px_50px_-38px_rgba(124,108,242,0.8)]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-ink-2">
          {uploading ? `Uploading… ${progress}%` : processingLabel}
        </p>
        <span className="tabular text-xs text-muted">{formatDuration(elapsedMs)}</span>
      </div>

      <div
        className="mt-3 h-1.5 overflow-hidden rounded-full bg-raised"
        role="progressbar"
        aria-valuenow={uploading ? progress : undefined}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={uploading ? "Upload progress" : processingLabel}
      >
        {uploading ? (
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand to-accent transition-[width] duration-200"
            style={{ width: `${progress}%` }}
          />
        ) : (
          <div className="animate-sweep h-full w-1/3 rounded-full bg-gradient-to-r from-brand to-accent" />
        )}
      </div>

      {!uploading ? (
        <p className="mt-2 text-[11px] text-muted">
          Large media can take several minutes. You can cancel at any time.
        </p>
      ) : null}
    </div>
  );
}
