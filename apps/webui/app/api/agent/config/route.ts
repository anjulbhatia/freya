import { NextResponse } from "next/server";
import { z } from "zod";
import { getAgentConfig, saveAgentConfig } from "foundercycle/db/client";

const bodySchema = z.object({
  model: z.string().trim().min(1).max(80).optional(),
  approval_mode: z.enum(["manual", "auto"]).optional(),
  review_threshold: z.number().finite().min(0).max(1).optional(),
});

export async function GET() {
  return NextResponse.json(await getAgentConfig());
}

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid config payload" }, { status: 400 });
  }
  return NextResponse.json(await saveAgentConfig(parsed.data));
}
