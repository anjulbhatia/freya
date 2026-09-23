import { NextResponse } from "next/server";
import { createCard, listCards, listCardsByProject, updateCard } from "foundercycle/db/client";

export async function GET(req: Request) {
  const project = new URL(req.url).searchParams.get("project");
  const rows = project ? await listCardsByProject(Number(project)) : await listCards();
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    title?: string;
    type?: string;
    status?: string;
    project_id?: number;
  };
  if (!body.title?.trim()) {
    return NextResponse.json({ error: "title required" }, { status: 400 });
  }
  const id = await createCard(
    body.title.trim(),
    body.type ?? "task",
    body.status ?? "planned",
    body.project_id ?? 1
  );
  return NextResponse.json({ ok: true, id });
}

export async function PATCH(req: Request) {
  const body = (await req.json()) as {
    id?: number;
    type?: string;
    status?: string;
    summary?: string;
    priority?: number;
    approval_flag?: number;
  };
  if (!body.id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  await updateCard(body.id, {
    type: body.type,
    status: body.status,
    summary: body.summary,
    priority: body.priority,
    approvalFlag: body.approval_flag,
  });
  return NextResponse.json({ ok: true });
}
