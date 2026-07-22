"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AppError } from "@/models/common.model";
import type { ScanRecord, ScanStats } from "@/models/scan.model";
import { scanHistoryService } from "@/services/scanHistory.service";

interface ScanHistoryStore {
  records: ScanRecord[];
  stats: ScanStats;
  isLoading: boolean;
  error: AppError | null;
  record: (entry: ScanRecord) => Promise<void>;
  remove: (id: string) => void;
  clear: () => void;
  retry: () => void;
}

const ScanHistoryContext = createContext<ScanHistoryStore | null>(null);

/** Shared history state backed by the API's local SQLite database. */
export function ScanHistoryProvider({ children }: { children: ReactNode }) {
  const [records, setRecords] = useState<ScanRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);

  const refresh = useCallback(() => {
    setIsLoading(true);
    setError(null);

    void scanHistoryService.load().then((result) => {
      if (result.ok) {
        setRecords(result.value);
      } else {
        setError(result.error);
      }
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    let active = true;

    void scanHistoryService.load().then((result) => {
      if (!active) return;
      if (result.ok) {
        setRecords(result.value);
      } else {
        setError(result.error);
      }
      setIsLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const record = useCallback(async (entry: ScanRecord) => {
    setRecords((current) => [entry, ...current.filter((item) => item.id !== entry.id)]);
    setError(null);

    const result = await scanHistoryService.add(entry);
    if (!result.ok) {
      setRecords((current) => current.filter((item) => item.id !== entry.id));
      setError(result.error);
    }
  }, []);

  const remove = useCallback(
    (id: string) => {
      setRecords((current) => current.filter((record) => record.id !== id));
      setError(null);

      void scanHistoryService.remove(id).then((result) => {
        if (!result.ok) {
          setError(result.error);
          refresh();
        }
      });
    },
    [refresh],
  );

  const clear = useCallback(() => {
    setRecords([]);
    setError(null);

    void scanHistoryService.clear().then((result) => {
      if (!result.ok) {
        setError(result.error);
        refresh();
      }
    });
  }, [refresh]);

  const stats = useMemo(() => scanHistoryService.stats(records), [records]);

  const value = useMemo<ScanHistoryStore>(
    () => ({ records, stats, isLoading, error, record, remove, clear, retry: refresh }),
    [records, stats, isLoading, error, record, remove, clear, refresh],
  );

  return (
    <ScanHistoryContext.Provider value={value}>{children}</ScanHistoryContext.Provider>
  );
}

export function useScanHistory(): ScanHistoryStore {
  const context = useContext(ScanHistoryContext);
  if (!context) {
    throw new Error("useScanHistory must be used inside <ScanHistoryProvider>.");
  }
  return context;
}
