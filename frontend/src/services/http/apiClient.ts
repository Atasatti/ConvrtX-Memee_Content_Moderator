import { API_BASE_URL } from "@/lib/config";
import type { AppError, Result } from "@/models/common.model";
import { Err, Ok } from "@/models/common.model";

export type UploadProgressHandler = (percent: number) => void;

export interface RequestOptions {
  timeoutMs?: number;
  signal?: AbortSignal;
  /** Only fires for uploads; download progress is not reported. */
  onProgress?: UploadProgressHandler;
}

/**
 * The backend proxies OpenAI failures through verbatim, so a dead API key
 * arrives as a wall of provider JSON. Rewrite the cases an operator can act on
 * into plain instructions; anything unrecognized passes through untouched.
 */
function describeUpstreamFailure(raw: string): AppError | null {
  if (/invalid_api_key|Incorrect API key/i.test(raw)) {
    return {
      message: "The backend's OpenAI API key is rejected by OpenAI.",
      detail:
        "Put a valid key in backend/.env, then confirm the backend restarted — the OpenAI client is built at startup, so a running server keeps using the old key. Image classification runs locally and is unaffected.",
    };
  }
  if (/insufficient_quota|exceeded your current quota/i.test(raw)) {
    return {
      message: "The OpenAI account has no remaining quota.",
      detail: "Add credit or raise the limit on the account that owns the API key.",
    };
  }
  if (/rate_limit_exceeded|Rate limit/i.test(raw)) {
    return {
      message: "OpenAI rate limit reached.",
      detail: "Wait a few seconds and run the scan again.",
    };
  }
  return null;
}

/** Pulls a usable message out of FastAPI's several error shapes. */
function extractErrorMessage(body: unknown, status: number): string {
  if (typeof body === "string" && body.trim()) return body.trim();

  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;

    // `analyze_text` returns 500 with {"error": "..."}
    if (typeof record.error === "string" && record.error) return record.error;

    const detail = record.detail;
    if (typeof detail === "string" && detail) return detail;

    // 422 validation errors arrive as [{loc, msg, type}, ...]
    if (Array.isArray(detail)) {
      const messages = detail
        .map((item) =>
          item && typeof item === "object" && "msg" in item
            ? String((item as Record<string, unknown>).msg)
            : null,
        )
        .filter((m): m is string => Boolean(m));
      if (messages.length) return messages.join("; ");
    }
  }

  return `Request failed with status ${status}`;
}

/** The single place a non-2xx response becomes a typed error. */
function toAppError(body: unknown, status: number): AppError {
  const raw = extractErrorMessage(body, status);
  const friendly = describeUpstreamFailure(raw);
  return friendly
    ? { ...friendly, status }
    : { message: raw, status };
}

function parseBody(text: string): unknown {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function networkError(message: string): AppError {
  return {
    message,
    detail: `Could not reach the Aegis API at ${API_BASE_URL}. Make sure the backend is running.`,
  };
}

type JsonMethod = "GET" | "POST" | "DELETE";

async function sendJsonRequest<T>(
  path: string,
  method: JsonMethod,
  options: RequestOptions = {},
  body?: unknown,
): Promise<Result<T>> {
  const { timeoutMs = 0, signal } = options;
  const controller = new AbortController();
  const timer =
    timeoutMs > 0 ? setTimeout(() => controller.abort(), timeoutMs) : null;
  const onAbort = () => controller.abort();
  signal?.addEventListener("abort", onAbort);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      signal: controller.signal,
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const parsed = parseBody(await response.text());

    if (!response.ok) {
      return Err(toAppError(parsed, response.status));
    }
    return Ok(parsed as T);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return Err({ message: signal?.aborted ? "Request cancelled." : "The request timed out." });
    }
    return Err(
      networkError(error instanceof Error ? error.message : "Unexpected error."),
    );
  } finally {
    if (timer) clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }
}

/**
 * Uploads via XMLHttpRequest rather than fetch: `fetch` cannot report upload
 * progress, and video files are large enough that a progress bar matters.
 */
function sendWithProgress<T>(
  url: string,
  body: FormData,
  options: RequestOptions,
): Promise<Result<T>> {
  const { timeoutMs = 0, signal, onProgress } = options;

  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    let settled = false;

    const finish = (result: Result<T>) => {
      if (settled) return;
      settled = true;
      signal?.removeEventListener("abort", onAbort);
      resolve(result);
    };

    const onAbort = () => {
      xhr.abort();
      finish(Err({ message: "Scan cancelled." }));
    };

    xhr.open("POST", url, true);
    if (timeoutMs > 0) xhr.timeout = timeoutMs;

    if (onProgress && xhr.upload) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      };
    }

    xhr.onload = () => {
      const parsed = parseBody(xhr.responseText);
      if (xhr.status >= 200 && xhr.status < 300) {
        finish(Ok(parsed as T));
      } else {
        finish(Err(toAppError(parsed, xhr.status)));
      }
    };

    xhr.onerror = () => finish(Err(networkError("Network error.")));
    xhr.ontimeout = () =>
      finish(
        Err({
          message: "The request timed out.",
          detail: "The file may be too long to process. Try a shorter clip.",
        }),
      );
    xhr.onabort = () => finish(Err({ message: "Scan cancelled." }));

    if (signal) {
      if (signal.aborted) {
        onAbort();
        return;
      }
      signal.addEventListener("abort", onAbort);
    }

    xhr.send(body);
  });
}

/**
 * The single egress point for every backend call. Returns `Result` instead of
 * throwing so ViewModels can branch on failure without try/catch.
 */
export const apiClient = {
  async postForm<T>(
    path: string,
    body: FormData,
    options: RequestOptions = {},
  ): Promise<Result<T>> {
    try {
      return await sendWithProgress<T>(`${API_BASE_URL}${path}`, body, options);
    } catch (error) {
      return Err(
        networkError(error instanceof Error ? error.message : "Unexpected error."),
      );
    }
  },

  get<T>(path: string, options: RequestOptions = {}): Promise<Result<T>> {
    return sendJsonRequest<T>(path, "GET", options);
  },

  postJson<T>(
    path: string,
    body: unknown,
    options: RequestOptions = {},
  ): Promise<Result<T>> {
    return sendJsonRequest<T>(path, "POST", options, body);
  },

  deleteJson<T>(path: string, options: RequestOptions = {}): Promise<Result<T>> {
    return sendJsonRequest<T>(path, "DELETE", options);
  },
};
