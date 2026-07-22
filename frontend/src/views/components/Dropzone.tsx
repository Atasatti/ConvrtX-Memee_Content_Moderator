"use client";

import { useCallback, useRef, useState } from "react";
import { UploadCloud, X } from "lucide-react";
import { cn, formatBytes } from "@/lib/utils";

interface DropzoneProps {
  file: File | null;
  onSelect: (file: File | null) => void;
  /** `accept` attribute for the file input, e.g. "image/*". */
  accept: string;
  label: string;
  hint: string;
  disabled?: boolean;
}

export function Dropzone({
  file,
  onSelect,
  accept,
  label,
  hint,
  disabled = false,
}: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const openPicker = useCallback(() => {
    if (!disabled) inputRef.current?.click();
  }, [disabled]);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setIsDragging(false);
      if (disabled) return;

      const dropped = event.dataTransfer.files?.[0];
      if (dropped) onSelect(dropped);
    },
    [disabled, onSelect],
  );

  return (
    <div>
      <div
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={openPicker}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openPicker();
          }
        }}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={label}
        aria-disabled={disabled}
        className={cn(
          "group flex flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-11 text-center transition-all",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
          disabled
            ? "cursor-not-allowed border-line opacity-50"
            : "cursor-pointer border-line-strong bg-canvas/35 hover:-translate-y-0.5 hover:border-brand/70 hover:bg-brand/5",
          isDragging && !disabled && "border-accent bg-accent/5",
        )}
      >
        <span className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-brand/10 text-brand-bright ring-1 ring-brand/20 transition-transform group-hover:scale-105">
          <UploadCloud size={21} aria-hidden />
        </span>
        <p className="text-sm font-medium text-ink">{label}</p>
        <p className="mt-1 text-xs text-muted">{hint}</p>

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="sr-only"
          disabled={disabled}
          onChange={(event) => {
            onSelect(event.target.files?.[0] ?? null);
            // Reset so re-picking the same file still fires a change event.
            event.target.value = "";
          }}
        />
      </div>

      {file ? (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-line bg-raised/80 px-3 py-2.5">
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-ink" title={file.name}>
              {file.name}
            </p>
            <p className="tabular text-[11px] text-muted">{formatBytes(file.size)}</p>
          </div>
          <button
            type="button"
            onClick={() => onSelect(null)}
            disabled={disabled}
            aria-label="Remove selected file"
            className="rounded p-1 text-muted transition-colors hover:text-ink disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <X size={15} />
          </button>
        </div>
      ) : null}
    </div>
  );
}
