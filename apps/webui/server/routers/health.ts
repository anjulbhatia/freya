import { publicProcedure, router } from "@/server/trpc";
import { apiChecks, getHealth, summarize, webmcpChecks } from "foundercycle/webmcp/health";

export const healthRouter = router({
  /** Lightweight reachability probe. No DB touch. */
  ping: publicProcedure.query(() => ({ ok: true, time: new Date().toISOString() })),
  /** API group: database, agent-config, classifier. */
  api: publicProcedure.query(async () => {
    const checks = await apiChecks();
    return { status: summarize(checks), checks };
  }),
  /** WebMCP group: registry, per-provider rows, tool manifest. */
  webmcp: publicProcedure.query(async () => {
    const checks = await webmcpChecks();
    return { status: summarize(checks), checks };
  }),
  /** Full panel payload: both groups + overall status. */
  all: publicProcedure.query(() => getHealth()),
});
