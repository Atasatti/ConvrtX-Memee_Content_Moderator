"use client";

import { useCallback, useMemo, useState } from "react";
import { createId } from "@/lib/utils";
import type { VideoAnalysis } from "@/models/nsfw.model";
import { moderationService } from "@/services/moderation.service";
import { summarizeVideo } from "./shared/summaries";
import { useAnalysisCommand } from "./shared/useAnalysisCommand";
import { useFileSelection } from "./shared/useFileSelection";

export function useVideoModerationViewModel() {
  const selection = useFileSelection("video", { withPreview: true });
  /** Which sampled frame the timeline has focused. */
  const [selectedFrame, setSelectedFrame] = useState(0);

  const command = useAnalysisCommand<File, VideoAnalysis>({
    execute: (file, options) => moderationService.analyzeVideo(file, options),
    toRecord: (file, analysis, durationMs) => ({
      id: createId(),
      kind: "video",
      subject: file.name,
      createdAt: new Date().toISOString(),
      flagged: analysis.flagged,
      risk: analysis.overallRisk,
      summary: summarizeVideo(analysis),
      durationMs,
    }),
  });

  const submit = useCallback(async () => {
    if (!selection.file || selection.validationError) return;
    await command.run(selection.file);
  }, [command, selection.file, selection.validationError]);

  const selectFile = useCallback(
    (file: File | null) => {
      selection.select(file);
      command.reset();
      setSelectedFrame(0);
    },
    [command, selection],
  );

  const clear = useCallback(() => {
    selection.clear();
    command.reset();
    setSelectedFrame(0);
  }, [command, selection]);

  const analysis = command.result;

  // Frames are sampled at roughly one per second, so the index doubles as a timestamp.
  const focusedFrame = useMemo(
    () => analysis?.frames[selectedFrame] ?? null,
    [analysis, selectedFrame],
  );

  const jumpToWorstFrame = useCallback(() => {
    if (analysis && analysis.worstFrameIndex >= 0) {
      setSelectedFrame(analysis.worstFrameIndex);
    }
  }, [analysis]);

  return {
    file: selection.file,
    previewUrl: selection.previewUrl,
    canSubmit: selection.isValid && !command.isRunning,

    selectFile,
    submit,
    clear,
    cancel: command.cancel,

    analysis,
    selectedFrame,
    setSelectedFrame,
    focusedFrame,
    jumpToWorstFrame,

    status: command.status,
    error: selection.validationError ?? command.error,
    progress: command.progress,
    isRunning: command.isRunning,
    elapsedMs: command.elapsedMs,
  };
}

export type VideoModerationViewModel = ReturnType<typeof useVideoModerationViewModel>;
