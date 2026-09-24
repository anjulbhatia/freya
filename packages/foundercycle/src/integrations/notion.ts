import { mockLatency, type RunContext, type ToolResult } from "./types";

export async function findContact(name: string): Promise<ToolResult> {
  await mockLatency();
  return { ok: true, step: `notion.findContact (stub): "${name}" not in cache` };
}

function blocked(step: string): ToolResult {
  return {
    ok: false,
    step: `${step} BLOCKED: no explicit approval flag`,
    detail: "Nothing written.",
  };
}

export async function createPage(
  ctx: RunContext,
  title: string,
  section = "Inbox"
): Promise<ToolResult> {
  if (!ctx.approved) return blocked("notion.createPage");
  await mockLatency();
  return {
    ok: true,
    step: `notion.createPage (stub): "${title}" under ${section}`,
    links: ["notion://page/stub"],
  };
}

export async function append(ctx: RunContext, _page: string, text: string): Promise<ToolResult> {
  if (!ctx.approved) return blocked("notion.append");
  await mockLatency();
  return { ok: true, step: `notion.append (stub): logged "${text.slice(0, 60)}"` };
}
