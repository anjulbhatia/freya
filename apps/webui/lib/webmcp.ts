import { PROVIDERS } from "@/lib/foundercycle";

export interface ServiceStatus {
  provider: string;
  label: string;
  ok: boolean;
  latencyMs: number;
}

export async function fetchWebmcpStatus(): Promise<ServiceStatus[]> {
  try {
    const res = await fetch("/api/webmcp", { cache: "no-store" });
    if (!res.ok) throw new Error("bad status");
    return (await res.json()) as ServiceStatus[];
  } catch {
    // API unreachable: report unknown/offline, never fake all-live.
    return PROVIDERS.map((p) => ({
      provider: p.id,
      label: p.label,
      ok: false,
      latencyMs: 0,
    }));
  }
}
