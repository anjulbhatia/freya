import { mockLatency, type RunContext, type ToolResult } from "./types";

export async function search(_query: string): Promise<ToolResult> {
  await mockLatency();
  return { ok: true, step: "gmail.search (stub): no threads matched" };
}

export async function draft(subject: string): Promise<ToolResult> {
  await mockLatency();
  return {
    ok: true,
    step: `gmail.draft (stub): draft created "${subject}"`,
    links: ["gmail://draft/stub"],
  };
}

export async function send(ctx: RunContext, subject: string): Promise<ToolResult> {
  if (!ctx.approved) {
    return {
      ok: false,
      step: "gmail.send BLOCKED: no explicit approval flag",
      detail: "Draft kept, nothing sent.",
    };
  }
  await mockLatency();
  return { ok: true, step: `gmail.send (stub): sent "${subject}"` };
}
