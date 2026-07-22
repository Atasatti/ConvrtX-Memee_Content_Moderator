"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { API_BASE_URL } from "@/lib/config";
import type { ApiHealth } from "@/services/system.service";
import { systemService } from "@/services/system.service";

export type ApiStatus = "checking" | "online" | "offline";

const POLL_INTERVAL_MS = 30_000;

/** Polls `/health` so the shell can show whether the backend is reachable. */
export function useApiStatusViewModel() {
  const [status, setStatus] = useState<ApiStatus>("checking");
  const [health, setHealth] = useState<ApiHealth | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const check = useCallback(async () => {
    const result = await systemService.checkHealth();
    if (!mountedRef.current) return;

    if (result.ok && result.value.online) {
      setHealth(result.value);
      setStatus("online");
      setMessage(null);
    } else {
      setHealth(null);
      setStatus("offline");
      setMessage(result.ok ? "API reported an unhealthy status." : result.error.message);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    // Subscribe to the backend's health by polling it. Every state update happens
    // in the async continuation after the request settles, never synchronously in
    // this effect body — the lint rule cannot see through the await.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void check();
    const timer = setInterval(() => void check(), POLL_INTERVAL_MS);

    return () => {
      mountedRef.current = false;
      clearInterval(timer);
    };
  }, [check]);

  return {
    status,
    health,
    message,
    baseUrl: API_BASE_URL,
    isOnline: status === "online",
    refresh: check,
  };
}
