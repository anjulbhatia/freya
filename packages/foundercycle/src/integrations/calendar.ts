import { mockLatency, type RunContext, type ToolResult } from "./types";

export async function listEvents(_date: string): Promise<ToolResult> {
  await mockLatency();
  return { ok: true, step: "calendar.listEvents (stub): no conflicts" };
}

export async function createEvent(ctx: RunContext, title: string): Promise<ToolResult> {
  if (!ctx.approved) {
    return {
      ok: false,
      step: "calendar.createEvent BLOCKED: no explicit approval flag",
      detail: "Nothing created.",
    };
  }
  await mockLatency();
  return {
    ok: true,
    step: `calendar.createEvent (stub): "${title}" (no overwrite)`,
    links: ["calendar://event/stub"],
  };
}
