import { PROVIDERS } from "@/lib/foundercycle";

export interface ServiceStatus {
  provider: string;
  label: string;
  ok: boolean;
  latencyMs: number;
}

export interface WebmcpToolManifest {
  name: string;
  description: string;
  requiresApproval: boolean;
}

function offline(): ServiceStatus[] {
  return PROVIDERS.map((p) => ({
    provider: p.id,
    label: p.label,
    ok: false,
    latencyMs: 0,
  }));
}

function asServices(payload: unknown): ServiceStatus[] | null {
  if (Array.isArray(payload)) return payload as ServiceStatus[];
  if (
    payload &&
    typeof payload === "object" &&
    Array.isArray((payload as { services?: unknown }).services)
  ) {
    return (payload as { services: ServiceStatus[] }).services;
  }
  return null;
}

export async function fetchWebmcpStatus(): Promise<ServiceStatus[]> {
  try {
    const res = await fetch("/api/webmcp", { cache: "no-store" });
    if (!res.ok) throw new Error("bad status");
    return asServices(await res.json()) ?? offline();
  } catch {
    // API unreachable: report offline, never fake all-live.
    return offline();
  }
}

export async function fetchWebmcpManifest(): Promise<WebmcpToolManifest[]> {
  const res = await fetch("/api/webmcp", { cache: "no-store" });
  if (!res.ok) throw new Error("bad manifest");
  const payload = (await res.json()) as {
    tools?: WebmcpToolManifest[];
  };
  return payload.tools ?? [];
}

export async function callWebmcpTool<T = unknown>(
  name: string,
  args: Record<string, unknown> = {}
): Promise<{ ok: boolean; result?: T; error?: string }> {
  const res = await fetch("/api/webmcp", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name, args }),
  });
  return (await res.json()) as { ok: boolean; result?: T; error?: string };
}
