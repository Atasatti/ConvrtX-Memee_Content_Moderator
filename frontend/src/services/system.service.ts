import { TIMEOUTS_MS } from "@/lib/config";
import type { Result } from "@/models/common.model";
import { Err, Ok } from "@/models/common.model";
import type { HealthResponseDto } from "@/models/dto/api.dto";
import { apiClient } from "./http/apiClient";

export interface ApiHealth {
  online: boolean;
  service: string;
  version: string;
  checkedAt: string;
}

export const systemService = {
  async checkHealth(signal?: AbortSignal): Promise<Result<ApiHealth>> {
    const result = await apiClient.get<HealthResponseDto>("/health", {
      timeoutMs: TIMEOUTS_MS.health,
      signal,
    });

    if (!result.ok) return Err(result.error);

    return Ok({
      online: result.value?.status === "ok",
      service: result.value?.service ?? "aegis-api",
      version: result.value?.version ?? "unknown",
      checkedAt: new Date().toISOString(),
    });
  },
};
