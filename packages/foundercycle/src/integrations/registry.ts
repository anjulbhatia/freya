import { getStore } from "../db/index";
import type { ProviderId } from "../types";

export interface ServiceStatus {
  provider: ProviderId;
  ok: boolean;
  latencyMs: number;
  detail: string;
}

/**
 * WebMCP service registry. Status comes from the store's connection rows.
 * Latency is the measured time of the status read itself.
 */
export async function getServiceStatus(): Promise<ServiceStatus[]> {
  const t0 = Date.now();
  const rows = await getStore().listConnections();
  const latencyMs = Math.max(1, Date.now() - t0);
  return rows.map((r) => ({
    provider: r.provider as ProviderId,
    ok: r.status === "connected",
    latencyMs,
    detail: r.status === "connected" ? "connected" : "disconnected",
  }));
}

export async function isConnected(provider: ProviderId): Promise<boolean> {
  const rows = await getStore().listConnections();
  return rows.some((r) => r.provider === provider && r.status === "connected");
}
