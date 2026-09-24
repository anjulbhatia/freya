import { mockLatency, type RunContext, type ToolResult } from "./types";

export async function getPullRequest(n: number): Promise<ToolResult> {
  await mockLatency();
  return {
    ok: true,
    step: `github.getPullRequest (stub): PR #${n} context pulled`,
    links: [`github://pr/${n}`],
  };
}

export async function createIssue(ctx: RunContext, title: string): Promise<ToolResult> {
  if (!ctx.approved) {
    return {
      ok: false,
      step: "github.createIssue BLOCKED: no explicit approval flag",
      detail: "Nothing created.",
    };
  }
  await mockLatency();
  return {
    ok: true,
    step: `github.createIssue (stub): "${title}"`,
    links: ["github://issue/stub"],
  };
}
