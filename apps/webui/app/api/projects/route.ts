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
  const body = (await req.json().catch(() => ({}))) as {
    id?: number;
    name?: string;
    archived?: boolean;
  };
  if (!Number.isInteger(body.id) || (body.id as number) <= 0) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  if (body.name !== undefined) {
    const name = body.name.trim();
    if (name.length < 1 || name.length > 120) {
      return NextResponse.json({ error: "invalid name" }, { status: 400 });
    }
    await renameProject(body.id as number, name);
  }
  if (body.archived !== undefined) {
    if (typeof body.archived !== "boolean") {
      return NextResponse.json({ error: "invalid archived flag" }, { status: 400 });
    }
    await archiveProject(body.id as number, body.archived);
  }
  return NextResponse.json({ ok: true });
}
