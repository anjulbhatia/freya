import { NextResponse } from "next/server";
import { getLatestProfile, saveProfile } from "foundercycle/db/client";

export async function GET() {
  return NextResponse.json((await getLatestProfile()) ?? null);
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { name?: string; context?: string };
  const name = body.name?.trim() ?? "";
  if (name.length < 1 || name.length > 120) {
    return NextResponse.json({ error: "invalid name" }, { status: 400 });
  }
  const context = body.context ?? "";
  if (typeof context !== "string" || context.length > 4000) {
    return NextResponse.json({ error: "invalid context" }, { status: 400 });
  }
  const profile = await saveProfile(name, context);
  return NextResponse.json({ ok: true, id: profile.id });
}
