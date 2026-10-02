import { NextResponse } from "next/server";
import { z } from "zod";
import { processNext } from "freya/agent/run";

const bodySchema = z.object({
  approved: z.boolean().default(false),
  project_id: z.number().int().positive().optional(),
});

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  const result = await processNext(parsed.data.approved, parsed.data.project_id);
  return NextResponse.json(result);
}
