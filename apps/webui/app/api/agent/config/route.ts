import { NextResponse } from "next/server";
import { getAgentConfig, saveAgentConfig } from "foundercycle/db/client";

export async function GET() {
  return NextResponse.json(await getAgentConfig());
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    model?: string;
    approval_mode?: "manual" | "auto";
    review_threshold?: number;
  };
  if (
    body.approval_mode !== undefined &&
    body.approval_mode !== "manual" &&
    body.approval_mode !== "auto"
  ) {
    return NextResponse.json({ error: "bad approval_mode" }, { status: 400 });
  }
  return NextResponse.json(
    await saveAgentConfig({
      model: body.model,
      approval_mode: body.approval_mode,
      review_threshold: body.review_threshold,
    })
  );
}
