"use client";

import { useCallback, useMemo, useState } from "react";
import { createId } from "@/lib/utils";
import type { ModerationVerdict } from "@/models/moderation.model";
import type { ImageAnalysis } from "@/models/nsfw.model";
import { moderationService } from "@/services/moderation.service";
import { summarizeImage, summarizeVerdict } from "./shared/summaries";
import { useAnalysisCommand } from "./shared/useAnalysisCommand";
import { useFileSelection } from "./shared/useFileSelection";

/** `full` classifies pixels and OCR'd text; `ocr` skips the NSFW model. */
export type ImageMode = "full" | "ocr";

export function useImageModerationViewModel() {
  const selection = useFileSelection("image", { withPreview: true });
  const [mode, setMode] = useState<ImageMode>("full");

  const full = useAnalysisCommand<File, ImageAnalysis>({
    execute: (file, options) => moderationService.analyzeImage(file, options),
    toRecord: (file, analysis, durationMs) => ({
      id: createId(),
      kind: "image",
      subject: file.name,
      createdAt: new Date().toISOString(),
      flagged: analysis.flagged,
      risk: analysis.overallRisk,
      summary: summarizeImage(analysis),
      durationMs,
    }),
  });

  const ocr = useAnalysisCommand<File, ModerationVerdict>({
    execute: (file, options) => moderationService.analyzeImageText(file, options),
    toRecord: (file, verdict, durationMs) => ({
      id: createId(),
      kind: "image-text",
      subject: file.name,
      createdAt: new Date().toISOString(),
      flagged: verdict.flagged,
      risk: verdict.risk,
      summary: summarizeVerdict(verdict),
      durationMs,
    }),
  });

  const active = mode === "full" ? full : ocr;

  const submit = useCallback(() => {
    if (!selection.file || selection.validationError) return;
    void (mode === "full" ? full.run(selection.file) : ocr.run(selection.file));
  }, [full, mode, ocr, selection.file, selection.validationError]);

  const changeMode = useCallback(
    (next: ImageMode) => {
      setMode(next);
      full.reset();
      ocr.reset();
    },
    [full, ocr],
  );

  const selectFile = useCallback(
    (file: File | null) => {
      selection.select(file);
      full.reset();
      ocr.reset();
    },
    [full, ocr, selection],
  );

  const clear = useCallback(() => {
    selection.clear();
    full.reset();
    ocr.reset();
  }, [full, ocr, selection]);

  const canSubmit = useMemo(
    () => selection.isValid && !active.isRunning,
    [selection.isValid, active.isRunning],
  );

  return {
    file: selection.file,
    previewUrl: selection.previewUrl,
    mode,
    changeMode,
    canSubmit,

    selectFile,
    submit,
    clear,
    cancel: active.cancel,

    full,
    ocr,
    status: active.status,
    // Validation failures are surfaced ahead of any request.
    error: selection.validationError ?? active.error,
    progress: active.progress,
    isRunning: active.isRunning,
    elapsedMs: active.elapsedMs,
  };
}

export type ImageModerationViewModel = ReturnType<typeof useImageModerationViewModel>;
