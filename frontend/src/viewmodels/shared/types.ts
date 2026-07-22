import type { AppError } from "@/models/common.model";

export type CommandStatus = "idle" | "running" | "success" | "error";

/**
 * The contract every analysis ViewModel exposes to its View. Views bind to these
 * fields and call these commands; they never touch services directly.
 */
export interface AnalysisCommand<TInput, TResult> {
  status: CommandStatus;
  result: TResult | null;
  error: AppError | null;
  /** Upload progress, 0–100. Stays at 100 while the server processes. */
  progress: number;
  /** Ticks while running, then freezes at the total for the completed run. */
  elapsedMs: number;
  isRunning: boolean;
  run: (input: TInput) => Promise<void>;
  cancel: () => void;
  reset: () => void;
}
