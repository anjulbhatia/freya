import type { CardType } from "../types";
import type { RunContext, ToolResult } from "../integrations/types";
import * as gmail from "../integrations/gmail";
import * as calendar from "../integrations/calendar";
import * as notion from "../integrations/notion";
import * as github from "../integrations/github";
import * as slack from "../integrations/slack";

export interface FlowOutcome {
  summary: string;
  links: string[];
  /** Column to move the card to when done. Planned = stay, await approval. */
  nextStatus: "planned" | "ongoing" | "completed";
}

function collect(results: ToolResult[]): { links: string[]; failed: boolean } {
  return {
    links: results.flatMap((r) => r.links ?? []),
    failed: results.some((r) => !r.ok),
  };
}

function proposed(summary: string): FlowOutcome {
  return { links: [], nextStatus: "planned", summary: `Proposed (needs approval): ${summary}` };
}

const flows: Record<CardType, (title: string, ctx: RunContext) => Promise<FlowOutcome>> = {
  async meeting(title, ctx) {
    const contact = await notion.findContact(title);
    const conflicts = await calendar.listEvents(title);
    if (!ctx.approved) {
      return proposed(`contact lookup + conflict check done; event + email draft await approval.`);
    }
    const event = await calendar.createEvent(ctx, title);
    const draft = await gmail.draft(title);
    const results = [contact, conflicts, event, draft];
    const { links, failed } = collect(results);
    if (failed) return proposed(`meeting prep incomplete; see run log.`);
    return {
      links,
      nextStatus: "ongoing",
      summary: `Meeting queued: contact lookup + conflict check + event + draft. ${draft.step}`,
    };
  },

  async bug(title, ctx) {
    const pr = title.match(/#(\d+)/);
    const context = pr
      ? await github.getPullRequest(Number(pr[1]))
      : { ok: true as const, step: "github: no PR number in title, skipped" };
    if (!ctx.approved) {
      return proposed(`PR context pulled; Notion note + Slack ping await approval.`);
    }
    const note = await notion.createPage(ctx, title, "Engineering");
    const ping = await slack.postMessage(ctx, "eng", `Triaged: ${title}`);
    const { links, failed } = collect([context, note, ping]);
    if (failed) return proposed(`bug triage incomplete; see run log.`);
    return {
      links,
      nextStatus: "ongoing",
      summary: `Bug triaged: PR context + Notion note + Slack ping.`,
    };
  },

  async task(title, ctx) {
    if (!ctx.approved) {
      return proposed(`deadline + draft + action log await approval.`);
    }
    const deadline = await calendar.createEvent(ctx, `Deadline: ${title}`);
    const draft = await gmail.draft(title);
    const log = await notion.append(ctx, "Actions", title);
    const { links, failed } = collect([deadline, draft, log]);
    if (failed) return proposed(`task setup incomplete; see run log.`);
    return {
      links,
      nextStatus: "ongoing",
      summary: `Task queued: deadline + draft + action log.`,
    };
  },

  async "follow-up"(title, ctx) {
    if (!ctx.approved) {
      return proposed(`email draft + action log await approval. Send needs approval.`);
    }
    const draft = await gmail.draft(title);
    const log = await notion.append(ctx, "Actions", title);
    const { links, failed } = collect([draft, log]);
    if (failed) return proposed(`follow-up incomplete; see run log.`);
    return {
      links,
      nextStatus: "ongoing",
      summary: `Follow-up drafted + logged. Send needs approval.`,
    };
  },

  async idea(title, ctx) {
    if (!ctx.approved) {
      return proposed(`Notion page under Ideas awaits approval.`);
    }
    const page = await notion.createPage(ctx, title, "Ideas");
    const { links, failed } = collect([page]);
    if (failed) return proposed(`idea filing incomplete; see run log.`);
    return {
      links,
      nextStatus: "completed",
      summary: `Idea filed in Notion under Ideas.`,
    };
  },
};

export function runFlow(type: CardType, title: string, ctx: RunContext): Promise<FlowOutcome> {
  return flows[type](title, ctx);
}
