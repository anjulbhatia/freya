import { NextResponse } from "next/server";
import { z } from "zod";
import { PROVIDERS } from "@/lib/foundercycle";
import { getServiceStatus } from "foundercycle/integrations/registry";
import { callWebmcpTool, webmcpManifest } from "foundercycle/webmcp/tools";

export async function GET() {
  const t0 = Date.now();
  const statuses = await getServiceStatus();
  const measured = Date.now() - t0;
  const labels = new Map(PROVIDERS.map((p) => [p.id, p.label]));
  return NextResponse.json({
    services: statuses.map((s) => ({
      provider: s.provider,
      label: labels.get(s.provider) ?? s.provider,
      ok: s.ok,
      latencyMs: measured + s.latencyMs,
    })),
    tools: webmcpManifest(),
  });
}

const callSchema = z.object({
  name: z.string().min(1).max(120),
  args: z.record(z.string(), z.unknown()).default({}),
});

export async function POST(req: Request) {
  const parsed = callSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid call payload" }, { status: 400 });
  }
  const out = await callWebmcpTool(parsed.data.name, parsed.data.args);
  const status = out.ok ? 200 : out.error === "approval required: pass approved:true with explicit human consent" ? 403 : 400;
  return NextResponse.json(out, { status });
}
