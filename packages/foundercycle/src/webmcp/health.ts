/**
 * Health checks for the Freya status panel.
 * Two groups mirror the panel sections: `api` (database, config,
 * classifier) and `webmcp` (per-provider connections + tool manifest).
 *
 * Status rule: database down -> "down"; any other failure ->
 * "degraded"; all green -> "operational". Same vocabulary as public
 * status pages so the panel reads instantly.
 */
import { getStore } from "../db/index";
import { classify } from "../agent/classify";
import { getServiceStatus } from "../integrations/registry";
import { webmcpTools } from "./tools";

export type HealthGroup = "api" | "webmcp";

export interface HealthCheck {
  name: string;
  group: HealthGroup;
  ok: boolean;
  latencyMs: number;
  detail: string;
}

export type HealthStatus = "operational" | "degraded" | "down";

export interface HealthReport {
  status: HealthStatus;
  checkedAt: string;
  checks: HealthCheck[];
}

async function timed<T>(
  name: string,
  group: HealthGroup,
  fn: () => Promise<{ ok: boolean; detail: string }>
): Promise<HealthCheck> {
  const t0 = Date.now();
  try {
    const r = await fn();
    return { name, group, ok: r.ok, latencyMs: Math.max(1, Date.now() - t0), detail: r.detail };
  } catch (e) {
    return {
      name,
      group,
      ok: false,
      latencyMs: Math.max(1, Date.now() - t0),
      detail: e instanceof Error ? e.message.slice(0, 160) : "check failed",
    };
  }
}

export async function apiChecks(): Promise<HealthCheck[]> {
  return Promise.all([
    timed("database", "api", async () => {
      await getStore().listProjects();
      return { ok: true, detail: "postgres reachable" };
    }),
    timed("agent-config", "api", async () => {
      const cfg = await getStore().getAgentConfig();
      return { ok: true, detail: `mode=${cfg.approval_mode} threshold=${cfg.review_threshold}` };
    }),
    timed("classifier", "api", async () => {
      const c = classify("Call Sam on Wednesday about the pilot");
      return { ok: c.type === "meeting", detail: `probe -> ${c.type} ${Math.round(c.confidence * 100)}%` };
    }),
  ]);
}

export async function webmcpChecks(): Promise<HealthCheck[]> {
  const rows = await timed("registry", "webmcp", async () => {
    const ss = await getServiceStatus();
    const live = ss.filter((s) => s.ok).length;
    return { ok: true, detail: `${live}/${ss.length} providers connected` };
  });
  const checks: HealthCheck[] = [rows];
  try {
    const ss = await getServiceStatus();
    for (const s of ss) {
      checks.push({
        name: `provider/${s.provider}`,
        group: "webmcp",
        ok: s.ok,
        latencyMs: s.latencyMs,
        detail: s.detail,
      });
    }
  } catch (e) {
    checks.push({
      name: "providers",
      group: "webmcp",
      ok: false,
      latencyMs: 1,
      detail: e instanceof Error ? e.message.slice(0, 160) : "registry unreadable",
    });
  }
  const gated = webmcpTools.filter((t) => t.requiresApproval).length;
  checks.push({
    name: "tools",
    group: "webmcp",
    ok: webmcpTools.length > 0,
    latencyMs: 1,
    detail: `${webmcpTools.length} tools (${gated} approval-gated)`,
  });
  return checks;
}

export function summarize(checks: HealthCheck[]): HealthStatus {
  if (!checks.some((c) => c.name === "database" && c.ok)) {
    // Database is the load-bearing check; without it nothing else matters.
    const db = checks.find((c) => c.name === "database");
    if (db && !db.ok) return "down";
  }
  return checks.every((c) => c.ok) ? "operational" : "degraded";
}

export async function getHealth(): Promise<HealthReport> {
  const checks = [...(await apiChecks()), ...(await webmcpChecks())];
  return { status: summarize(checks), checkedAt: new Date().toISOString(), checks };
}
