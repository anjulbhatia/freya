import { NextResponse } from "next/server";
import { listConnections, setConnectionStatus } from "foundercycle/db/client";

export async function GET() {
  return NextResponse.json(await listConnections());
}

export async function POST(req: Request) {
  const body = (await req.json()) as { provider?: string; status?: string };
  if (!body.provider) {
    return NextResponse.json({ error: "provider required" }, { status: 400 });
  }
  await setConnectionStatus(body.provider, body.status ?? "connected");
  return NextResponse.json({ ok: true });
}
