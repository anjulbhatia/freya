import { NextResponse } from "next/server";
import { z } from "zod";
import { listConnections, setConnectionStatus } from "foundercycle/db/client";
import { providerIdSchema } from "foundercycle/schemas";

const bodySchema = z.object({
  provider: providerIdSchema,
  status: z.enum(["connected", "disconnected"]).default("connected"),
});

export async function GET() {
  return NextResponse.json(await listConnections());
}

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid provider or status" }, { status: 400 });
  }
  await setConnectionStatus(parsed.data.provider, parsed.data.status);
  return NextResponse.json({ ok: true });
}
