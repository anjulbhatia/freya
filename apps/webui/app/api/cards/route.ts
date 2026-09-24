import { NextResponse } from "next/server";
import { z } from "zod";
import { createCard, listCards, listCardsByProject, updateCard } from "foundercycle/db/client";
import { cardTypeSchema, columnIdSchema } from "foundercycle/schemas";

const createSchema = z.object({
  title: z.string().trim().min(1).max(2000),
  type: cardTypeSchema.default("task"),
  status: columnIdSchema.default("planned"),
  project_id: z.number().int().positive().default(1),
});

const patchSchema = z.object({
  id: z.number().int().positive(),
  type: cardTypeSchema.optional(),
  status: columnIdSchema.optional(),
  summary: z.string().max(2000).optional(),
  priority: z.number().int().optional(),
  approval_flag: z.number().int().min(0).max(1).optional(),
});

export async function GET(req: Request) {
  const raw = new URL(req.url).searchParams.get("project");
  if (raw !== null) {
    const parsed = z.coerce.number().int().positive().safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid project id" }, { status: 400 });
    }
    return NextResponse.json(await listCardsByProject(parsed.data));
  }
  const rows = await listCards();
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const parsed = createSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid card payload" }, { status: 400 });
  }
  const body = parsed.data;
  const id = await createCard(body.title, body.type, body.status, body.project_id);
  return NextResponse.json({ ok: true, id });
}

export async function PATCH(req: Request) {
  const parsed = patchSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid card patch" }, { status: 400 });
  }
  const body = parsed.data;
  await updateCard(body.id, {
    type: body.type,
    status: body.status,
    summary: body.summary,
    priority: body.priority,
    approvalFlag: body.approval_flag,
  });
  return NextResponse.json({ ok: true });
}
