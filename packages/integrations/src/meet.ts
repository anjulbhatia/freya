import { mockLatency, type RunContext, type ToolResult } from "./types";

/**
 * Google Meet stub. Mirrors the calendar approval gate:
 * reads are free, space creation needs explicit approval.
 * Real impl: Google Meet API (createSpace) via Calendar conferenceData.
 */

export async function getSpace(name: string): Promise<ToolResult> {
  await mockLatency();
  return { ok: true, step: `meet.getSpace (stub): "${name}" has no live space yet` };
}

export async function createSpace(ctx: RunContext, title: string): Promise<ToolResult> {
  if (!ctx.approved) {
    return {
      ok: false,
      step: "meet.createSpace BLOCKED: no explicit approval flag",
      detail: "Nothing created.",
    };
  }
  await mockLatency();
  return {
    ok: true,
    step: `meet.createSpace (stub): "${title}"`,
    links: ["meet://space/stub"],
  };
}
