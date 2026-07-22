"use client";

import { useCallback, useMemo, useState } from "react";
import { createId, truncate } from "@/lib/utils";
import type { ModerationVerdict, NumberCheckResult } from "@/models/moderation.model";
import { moderationService } from "@/services/moderation.service";
import { summarizeNumbers, summarizeVerdict } from "./shared/summaries";
import { useAnalysisCommand } from "./shared/useAnalysisCommand";

/** Full policy moderation, or the cheaper phone-number-only pass. */
export type TextMode = "moderation" | "numbers";

export const MAX_TEXT_LENGTH = 20_000;

export function useTextModerationViewModel() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<TextMode>("moderation");

  const moderation = useAnalysisCommand<string, ModerationVerdict>({
    execute: (input, options) => moderationService.analyzeText(input, options),
    validate: (input) =>
      input.trim() ? null : { message: "Enter some text to analyze." },
    toRecord: (input, verdict, durationMs) => ({
      id: createId(),
      kind: "text",
      subject: truncate(input, 60),
      createdAt: new Date().toISOString(),
      flagged: verdict.flagged,
      risk: verdict.risk,
      summary: summarizeVerdict(verdict),
      durationMs,
    }),
  });

  const numbers = useAnalysisCommand<string, NumberCheckResult>({
    execute: (input, options) => moderationService.checkNumbers(input, options),
    validate: (input) =>
      input.trim() ? null : { message: "Enter some text to analyze." },
    toRecord: (input, result, durationMs) => ({
      id: createId(),
      kind: "number",
      subject: truncate(input, 60),
      createdAt: new Date().toISOString(),
      flagged: result.flagged,
      risk: result.flagged ? "elevated" : "safe",
      summary: summarizeNumbers(result),
      durationMs,
    }),
  });

  const active = mode === "moderation" ? moderation : numbers;

  const submit = useCallback(() => {
    void (mode === "moderation" ? moderation.run(text) : numbers.run(text));
  }, [mode, moderation, numbers, text]);

  const changeMode = useCallback(
    (next: TextMode) => {
      setMode(next);
      // Results are mode-specific; clear both so stale output can't linger.
      moderation.reset();
      numbers.reset();
    },
    [moderation, numbers],
  );

  const clear = useCallback(() => {
    setText("");
    moderation.reset();
    numbers.reset();
  }, [moderation, numbers]);

  const loadSample = useCallback(
    (sample: string) => {
      setText(sample);
      moderation.reset();
      numbers.reset();
    },
    [moderation, numbers],
  );

  const canSubmit = useMemo(
    () => text.trim().length > 0 && text.length <= MAX_TEXT_LENGTH && !active.isRunning,
    [text, active.isRunning],
  );

  return {
    // Bindings
    text,
    setText,
    mode,
    changeMode,
    charCount: text.length,
    maxLength: MAX_TEXT_LENGTH,
    isOverLimit: text.length > MAX_TEXT_LENGTH,
    canSubmit,

    // Commands
    submit,
    clear,
    loadSample,
    cancel: active.cancel,

    // Per-mode state, so the view renders the right result panel
    moderation,
    numbers,
    status: active.status,
    error: active.error,
    isRunning: active.isRunning,
    elapsedMs: active.elapsedMs,
  };
}

export type TextModerationViewModel = ReturnType<typeof useTextModerationViewModel>;
