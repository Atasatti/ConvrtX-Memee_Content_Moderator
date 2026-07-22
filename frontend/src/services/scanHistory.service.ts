import { HISTORY_STORAGE_KEY, TIMEOUTS_MS } from "@/lib/config";
import type { Result } from "@/models/common.model";
import { Err, Ok } from "@/models/common.model";
import type { ScanKind, ScanRecord, ScanStats } from "@/models/scan.model";
import { SCAN_KIND_LABELS } from "@/models/scan.model";
import { apiClient } from "./http/apiClient";

/**
 * History is persisted by the backend in database/history/aegis-history.sqlite3.
 * The localStorage reader remains only to migrate entries created by older builds.
 */

const VALID_KINDS = new Set(Object.keys(SCAN_KIND_LABELS));
const VALID_RISKS = new Set(["safe", "low", "elevated", "high", "critical"]);

function isScanRecord(value: unknown): value is ScanRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.kind === "string" &&
    VALID_KINDS.has(record.kind) &&
    typeof record.subject === "string" &&
    typeof record.createdAt === "string" &&
    typeof record.flagged === "boolean" &&
    typeof record.risk === "string" &&
    VALID_RISKS.has(record.risk) &&
    typeof record.summary === "string" &&
    typeof record.durationMs === "number"
  );
}

function sortNewestFirst(records: ScanRecord[]): ScanRecord[] {
  return records.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

function readLegacyHistory(): ScanRecord[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isScanRecord) : [];
  } catch {
    return [];
  }
}

function validateHistory(value: unknown): Result<ScanRecord[]> {
  if (!Array.isArray(value)) {
    return Err({ message: "The history API returned an invalid response." });
  }

  const records = value.filter(isScanRecord);
  if (records.length !== value.length) {
    return Err({ message: "The history database contains an invalid record." });
  }
  return Ok(sortNewestFirst(records));
}

function emptyByKind(): Record<ScanKind, number> {
  return { text: 0, number: 0, image: 0, "image-text": 0, audio: 0, video: 0 };
}

export const scanHistoryService = {
  async load(): Promise<Result<ScanRecord[]>> {
    const legacy = readLegacyHistory();
    if (legacy.length > 0) {
      const migration = await apiClient.postJson<{ imported: number }>(
        "/history/import",
        { records: legacy },
        { timeoutMs: TIMEOUTS_MS.history },
      );
      if (!migration.ok) return Err(migration.error);
    }
    window.localStorage.removeItem(HISTORY_STORAGE_KEY);

    const result = await apiClient.get<unknown>("/history", {
      timeoutMs: TIMEOUTS_MS.history,
    });
    return result.ok ? validateHistory(result.value) : Err(result.error);
  },

  add(record: ScanRecord): Promise<Result<ScanRecord>> {
    return apiClient.postJson<ScanRecord>("/history", record, {
      timeoutMs: TIMEOUTS_MS.history,
    });
  },

  async remove(id: string): Promise<Result<void>> {
    const result = await apiClient.deleteJson<null>(
      `/history/${encodeURIComponent(id)}`,
      { timeoutMs: TIMEOUTS_MS.history },
    );
    return result.ok ? Ok(undefined) : Err(result.error);
  },

  async clear(): Promise<Result<void>> {
    const result = await apiClient.deleteJson<null>("/history", {
      timeoutMs: TIMEOUTS_MS.history,
    });
    return result.ok ? Ok(undefined) : Err(result.error);
  },

  stats(records: ScanRecord[], recentLimit = 6): ScanStats {
    const byKind = emptyByKind();
    let flagged = 0;

    for (const record of records) {
      byKind[record.kind] += 1;
      if (record.flagged) flagged += 1;
    }

    const total = records.length;
    return {
      total,
      flagged,
      clean: total - flagged,
      flaggedRate: total === 0 ? 0 : flagged / total,
      byKind,
      recent: records.slice(0, recentLimit),
    };
  },
};
