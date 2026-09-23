import { NextResponse } from "next/server";
import {
  archiveProject,
  createProject,
  listProjects,
  renameProject,
} from "foundercycle/db/client";

export async function GET() {
  return NextResponse.json(await listProjects());
}

export async function POST(req: Request) {
  const body = (await req.json()) as { name?: string };
  if (!body.name?.trim()) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }
  return NextResponse.json({ ok: true, id: await createProject(body.name.trim()) });
}

export async function PATCH(req: Request) {
  const body = (await req.json()) as {
    id?: number;
    name?: string;
    archived?: boolean;
  };
  if (!body.id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  if (body.name !== undefined) await renameProject(body.id, body.name);
  if (body.archived !== undefined) await archiveProject(body.id, body.archived);
  return NextResponse.json({ ok: true });
}
