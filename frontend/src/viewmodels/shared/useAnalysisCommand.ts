"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AppError, Result } from "@/models/common.model";
import type { ScanRecord } from "@/models/scan.model";
import type { RequestOptions } from "@/services/http/apiClient";
import { useScanHistory } from "../scanHistoryStore";
import type { AnalysisCommand, CommandStatus } from "./types";

interface AnalysisCommandConfig<TInput, TResult> {
  /** Calls the service. Receives request options carrying abort + progress wiring. */
  execute: (input: TInput, options: RequestOptions) => Promise<Result<TResult>>;
  /** Runs before `execute`; returning an error short-circuits without a request. */
  validate?: (input: TInput) => AppError | null;
  /** Builds the history entry written on success. Omit to skip logging. */
  toRecord?: (input: TInput, result: TResult, durationMs: number) => ScanRecord;
}

/**
 * The engine behind every analysis ViewModel: owns status, progress, elapsed
 * time, cancellation, and history logging so the feature hooks stay declarative.
 */
export function useAnalysisCommand<TInput, TResult>(
  config: AnalysisCommandConfig<TInput, TResult>,
): AnalysisCommand<TInput, TResult> {
  const { record } = useScanHistory();

  const [status, setStatus] = useState<CommandStatus>("idle");
  const [result, setResult] = useState<TResult | null>(null);
  const [error, setError] = useState<AppError | null>(null);
  const [progress, setProgress] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);

  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  // Held in a ref so `run` stays stable even as callers pass new closures.
  // Synced after commit rather than during render; `run` only ever fires from
  // event handlers, by which point the ref is current.
  const configRef = useRef(config);
  useEffect(() => {
    configRef.current = config;
  });

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, []);

  const run = useCallback(
    async (input: TInput) => {
      const { execute, validate, toRecord } = configRef.current;

      const validationError = validate?.(input) ?? null;
      if (validationError) {
        setStatus("error");
        setError(validationError);
        setResult(null);
        return;
      }

      // Supersede any run still in flight.
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setStatus("running");
      setError(null);
      setResult(null);
      setProgress(0);
      setElapsedMs(0);

      const startedAt = performance.now();
      const ticker = setInterval(() => {
        if (mountedRef.current) setElapsedMs(performance.now() - startedAt);
      }, 100);

      const outcome = await execute(input, {
        signal: controller.signal,
        onProgress: (percent) => {
          if (mountedRef.current) setProgress(percent);
        },
      });

      clearInterval(ticker);
      const durationMs = performance.now() - startedAt;

      // A superseded run must not clobber the state of the one that replaced it.
      if (!mountedRef.current || abortRef.current !== controller) return;

      setElapsedMs(durationMs);
      abortRef.current = null;

      if (outcome.ok) {
        setResult(outcome.value);
        setStatus("success");
        setProgress(100);
        const entry = toRecord?.(input, outcome.value, durationMs);
        if (entry) await record(entry);
      } else {
        setError(outcome.error);
        setStatus("error");
      }
    },
    [record],
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStatus("idle");
    setProgress(0);
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStatus("idle");
    setResult(null);
    setError(null);
    setProgress(0);
    setElapsedMs(0);
  }, []);

  return {
    status,
    result,
    error,
    progress,
    elapsedMs,
    isRunning: status === "running",
    run,
    cancel,
    reset,
  };
}
