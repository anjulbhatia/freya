import { mockLatency, type RunContext, type ToolResult } from "./types";

export async function postMessage(
  ctx: RunContext,
  channel: string,
  text: string
): Promise<ToolResult> {
  if (!ctx.approved) {
    return {
      ok: false,
      step: "slack.postMessage BLOCKED: no explicit approval flag",
      detail: "Nothing posted.",
    };
  }
  await mockLatency();
  return {
    ok: true,
    step: `slack.postMessage (stub): #${channel} "${text.slice(0, 60)}"`,
  };
}
