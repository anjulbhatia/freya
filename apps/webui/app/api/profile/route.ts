import { NextResponse } from "next/server";
import { getLatestProfile, saveProfile } from "foundercycle/db/client";

export async function GET() {
  return NextResponse.json(getLatestProfile() ?? null);
}

export async function POST(req: Request) {
  const body = (await req.json()) as { name?: string; context?: string };
  if (!body.name?.trim()) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }
  const profile = saveProfile(body.name.trim(), body.context ?? "");
  return NextResponse.json({ ok: true, id: profile.id });
}
