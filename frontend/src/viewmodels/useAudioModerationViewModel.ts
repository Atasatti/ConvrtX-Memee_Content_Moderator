"use client";

import { useCallback, useMemo } from "react";
import { createId } from "@/lib/utils";
import type { ModerationVerdict } from "@/models/moderation.model";
import { isVideoFile } from "@/models/upload.model";
import { moderationService } from "@/services/moderation.service";
import { summarizeVerdict } from "./shared/summaries";
import { useAnalysisCommand } from "./shared/useAnalysisCommand";
import { useFileSelection } from "./shared/useFileSelection";

/**
 * Transcribes a file with Whisper and moderates the transcript. Video files are
 * routed to `/audio/transcribe_video`, which demuxes the audio track first — so
 * the view can accept either kind without asking the user which it is.
 */
export function useAudioModerationViewModel() {
  const selection = useFileSelection("audio", { withPreview: true });

  const command = useAnalysisCommand<File, ModerationVerdict>({
    execute: (file, options) =>
      isVideoFile(file)
        ? moderationService.analyzeVideoAudio(file, options)
        : moderationService.analyzeAudio(file, options),
    toRecord: (file, verdict, durationMs) => ({
      id: createId(),
      kind: "audio",
      subject: file.name,
      createdAt: new Date().toISOString(),
      flagged: verdict.flagged,
      risk: verdict.risk,
      summary: summarizeVerdict(verdict),
      durationMs,
    }),
  });

  const submit = useCallback(() => {
    if (!selection.file || selection.validationError) return;
    void command.run(selection.file);
  }, [command, selection.file, selection.validationError]);

  const selectFile = useCallback(
    (file: File | null) => {
      selection.select(file);
      command.reset();
    },
    [command, selection],
  );

  const clear = useCallback(() => {
    selection.clear();
    command.reset();
  }, [command, selection]);

  const isVideoSource = useMemo(
    () => (selection.file ? isVideoFile(selection.file) : false),
    [selection.file],
  );

  return {
    file: selection.file,
    previewUrl: selection.previewUrl,
    isVideoSource,
    canSubmit: selection.isValid && !command.isRunning,

    selectFile,
    submit,
    clear,
    cancel: command.cancel,

    verdict: command.result,
    status: command.status,
    error: selection.validationError ?? command.error,
    progress: command.progress,
    isRunning: command.isRunning,
    elapsedMs: command.elapsedMs,
  };
}

export type AudioModerationViewModel = ReturnType<typeof useAudioModerationViewModel>;
