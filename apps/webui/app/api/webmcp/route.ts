import { NextResponse } from "next/server";
import { PROVIDERS } from "@/lib/foundercycle";
import { getServiceStatus } from "foundercycle/integrations/registry";

export async function GET() {
  const t0 = Date.now();
  const statuses = await getServiceStatus();
  const measured = Date.now() - t0;
  const labels = new Map(PROVIDERS.map((p) => [p.id, p.label]));
  return NextResponse.json(
    statuses.map((s) => ({
      provider: s.provider,
      label: labels.get(s.provider) ?? s.provider,
      ok: s.ok,
      latencyMs: measured + s.latencyMs,
    }))
  );
}
