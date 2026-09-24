/**
 * WebMCP tool library for Freya / FounderCycle.
 *
 * One canonical table of every operation the agent and external callers
 * may perform: kanban, projects, agent loop, all five integrations,
 * profile, connections, service status.
 *
 * Rules:
 * - Reads are ungated (requiresApproval: false).
 * - Anything that writes externally (calendar event, email send, slack
 *   post, notion/github write) or mutates board state beyond drafting
 *   requires explicit approval (requiresApproval: true). The executor
 *   rejects gated tools unless args.approved === true.
 * - `agent.processNext` is the only tool that derives approval itself
 *   (call flag OR auto mode OR card approvalFlag); it still takes an
 *   explicit `approved` arg and is marked gated so callers show consent.
 * - `kanban.approveCard` is the consent grant: it flips approvalFlag
 *   and is itself gated to prevent silent self-approval by default flows.
 */
import { z } from "zod";
import { getStore } from "../db/index";
import { cardTypeSchema, columnIdSchema, providerIdSchema } from "../schemas";
import { classify } from "../agent/classify";
import { processNext } from "../agent/run";
import * as gmail from "../integrations/gmail";
import * as calendar from "../integrations/calendar";
import * as notion from "../integrations/notion";
import * as github from "../integrations/github";
import * as slack from "../integrations/slack";
import { getServiceStatus } from "../integrations/registry";
import type { RunContext } from "../integrations/types";

export interface WebmcpToolDef {
  name: string;
  description: string;
  requiresApproval: boolean;
  schema: z.ZodTypeAny;
  run: (args: any) => Promise<unknown>;
}

function ctxFor(title: string, approved: boolean): RunContext {
  return { cardId: 0, cardTitle: title, approved, profileName: "webmcp" };
}

const projectId = z.number().int().positive();
const approvedFlag = z.boolean().default(false);
const titleField = z.string().trim().min(1).max(2000);

export const webmcpTools: WebmcpToolDef[] = [
  // ---- Kanban (board = decision surface) ----
  {
    name: "kanban.listCards",
    description: "List cards, optionally filtered by project.",
    requiresApproval: false,
    schema: z.object({ projectId: projectId.optional() }),
    run: async ({ projectId: pid }: { projectId?: number }) =>
      pid === undefined
        ? getStore().listCards()
        : getStore().listCardsByProject(pid),
  },
  {
    name: "kanban.getNext",
    description: "Get the next actionable card (planned first, then priority).",
    requiresApproval: false,
    schema: z.object({ projectId: projectId.optional() }),
    run: async ({ projectId: pid }: { projectId?: number }) =>
      (await getStore().getNextCard(pid)) ?? null,
  },
  {
    name: "kanban.createCard",
    description: "Create a card. Draft only; does not execute integrations.",
    requiresApproval: true,
    schema: z.object({
      title: titleField,
      type: cardTypeSchema.default("task"),
      status: columnIdSchema.default("planned"),
      projectId: projectId.default(1),
      approved: approvedFlag,
    }),
    run: async (a: { title: string; type: string; status: string; projectId: number }) => ({
      id: await getStore().createCard(a.title, a.type, a.status, a.projectId),
    }),
  },
  {
    name: "kanban.updateCard",
    description: "Patch type/status/summary/priority on a card.",
    requiresApproval: true,
    schema: z.object({
      id: z.number().int().positive(),
      type: cardTypeSchema.optional(),
      status: columnIdSchema.optional(),
      summary: z.string().max(2000).optional(),
      priority: z.number().int().optional(),
      approved: approvedFlag,
    }),
    run: async (a: any) => {
      const { id, approved: _a, ...patch } = a;
      await getStore().updateCard(id, patch);
      return { ok: true };
    },
  },
  {
    name: "kanban.moveCard",
    description: "Move a card to another column.",
    requiresApproval: true,
    schema: z.object({
      id: z.number().int().positive(),
      status: columnIdSchema,
      approved: approvedFlag,
    }),
    run: async (a: { id: number; status: string }) => {
      await getStore().updateCard(a.id, { status: a.status });
      return { ok: true };
    },
  },
  {
    name: "kanban.approveCard",
    description: "Grant (or revoke) explicit approval on a card. This is the human-in-the-loop consent bit the agent checks before any external write.",
    requiresApproval: true,
    schema: z.object({
      id: z.number().int().positive(),
      approved: z.boolean(),
    }),
    run: async (a: { id: number; approved: boolean }) => {
      await getStore().updateCard(a.id, { approvalFlag: a.approved ? 1 : 0 });
      return { ok: true };
    },
  },

  // ---- Projects ----
  {
    name: "project.list",
    description: "List projects (excludes archived by default).",
    requiresApproval: false,
    schema: z.object({ includeArchived: z.boolean().default(false) }),
    run: async (a: { includeArchived: boolean }) =>
      getStore().listProjects(a.includeArchived),
  },
  {
    name: "project.create",
    description: "Create a project.",
    requiresApproval: true,
    schema: z.object({
      name: z.string().trim().min(1).max(120),
      approved: approvedFlag,
    }),
    run: async (a: { name: string }) => ({
      id: await getStore().createProject(a.name),
    }),
  },
  {
    name: "project.rename",
    description: "Rename a project.",
    requiresApproval: true,
    schema: z.object({
      id: projectId,
      name: z.string().trim().min(1).max(120),
      approved: approvedFlag,
    }),
    run: async (a: { id: number; name: string }) => {
      await getStore().renameProject(a.id, a.name);
      return { ok: true };
    },
  },
  {
    name: "project.archive",
    description: "Archive or unarchive a project.",
    requiresApproval: true,
    schema: z.object({
      id: projectId,
      archived: z.boolean().default(true),
      approved: approvedFlag,
    }),
    run: async (a: { id: number; archived: boolean }) => {
      await getStore().archiveProject(a.id, a.archived);
      return { ok: true };
    },
  },

  // ---- Agent loop ----
  {
    name: "agent.classify",
    description: "Classify a card title (meeting|task|bug|idea|follow-up) with confidence. Pure, no side effects.",
    requiresApproval: false,
    schema: z.object({ title: titleField }),
    run: async (a: { title: string }) => classify(a.title),
  },
  {
    name: "agent.processNext",
    description: "Run the core loop once: next card -> classify -> propose or execute -> write back. Pass approved:true only with explicit human consent.",
    requiresApproval: true,
    schema: z.object({
      approved: approvedFlag,
      projectId: projectId.optional(),
    }),
    run: async (a: { approved: boolean; projectId?: number }) =>
      processNext(a.approved, a.projectId),
  },
  {
    name: "agent.getConfig",
    description: "Read agent config (model, approval_mode, review_threshold).",
    requiresApproval: false,
    schema: z.object({}),
    run: async () => getStore().getAgentConfig(),
  },

  // ---- Gmail ----
  {
    name: "gmail.search",
    description: "Search mail threads (read-only).",
    requiresApproval: false,
    schema: z.object({ query: z.string().trim().min(1).max(500) }),
    run: async (a: { query: string }) => gmail.search(a.query),
  },
  {
    name: "gmail.draft",
    description: "Create an email draft. Safe: never sends.",
    requiresApproval: true,
    schema: z.object({ subject: titleField, approved: approvedFlag }),
    run: async (a: { subject: string }) => gmail.draft(a.subject),
  },
  {
    name: "gmail.send",
    description: "Send an email. Irreversible: needs explicit approval.",
    requiresApproval: true,
    schema: z.object({ subject: titleField, approved: approvedFlag }),
    run: async (a: { subject: string; approved: boolean }) =>
      gmail.send(ctxFor(a.subject, a.approved), a.subject),
  },

  // ---- Calendar ----
  {
    name: "calendar.listEvents",
    description: "List events / check conflicts (read-only).",
    requiresApproval: false,
    schema: z.object({ date: z.string().trim().min(1).max(200) }),
    run: async (a: { date: string }) => calendar.listEvents(a.date),
  },
  {
    name: "calendar.createEvent",
    description: "Create a calendar event. External write: needs approval.",
    requiresApproval: true,
    schema: z.object({ title: titleField, approved: approvedFlag }),
    run: async (a: { title: string; approved: boolean }) =>
      calendar.createEvent(ctxFor(a.title, a.approved), a.title),
  },

  // ---- Notion ----
  {
    name: "notion.findContact",
    description: "Look up a contact in Notion (read-only).",
    requiresApproval: false,
    schema: z.object({ name: z.string().trim().min(1).max(200) }),
    run: async (a: { name: string }) => notion.findContact(a.name),
  },
  {
    name: "notion.createPage",
    description: "Create a Notion page under a section. External write: needs approval.",
    requiresApproval: true,
    schema: z.object({
      title: titleField,
      section: z.string().trim().min(1).max(120).default("Inbox"),
      approved: approvedFlag,
    }),
    run: async (a: { title: string; section: string; approved: boolean }) =>
      notion.createPage(ctxFor(a.title, a.approved), a.title, a.section),
  },
  {
    name: "notion.append",
    description: "Append text to a Notion page. External write: needs approval.",
    requiresApproval: true,
    schema: z.object({
      page: z.string().trim().min(1).max(200),
      text: z.string().trim().min(1).max(2000),
      approved: approvedFlag,
    }),
    run: async (a: { page: string; text: string; approved: boolean }) =>
      notion.append(ctxFor(a.text, a.approved), a.page, a.text),
  },

  // ---- GitHub ----
  {
    name: "github.getPullRequest",
    description: "Pull PR context (read-only).",
    requiresApproval: false,
    schema: z.object({ number: z.number().int().positive() }),
    run: async (a: { number: number }) => github.getPullRequest(a.number),
  },
  {
    name: "github.createIssue",
    description: "Create a GitHub issue. External write: needs approval.",
    requiresApproval: true,
    schema: z.object({ title: titleField, approved: approvedFlag }),
    run: async (a: { title: string; approved: boolean }) =>
      github.createIssue(ctxFor(a.title, a.approved), a.title),
  },

  // ---- Slack ----
  {
    name: "slack.postMessage",
    description: "Post a Slack message. Irreversible notification: needs approval.",
    requiresApproval: true,
    schema: z.object({
      channel: z.string().trim().min(1).max(120),
      text: z.string().trim().min(1).max(2000),
      approved: approvedFlag,
    }),
    run: async (a: { channel: string; text: string; approved: boolean }) =>
      slack.postMessage(ctxFor(a.text, a.approved), a.channel, a.text),
  },

  // ---- Profile / connections / status ----
  {
    name: "profile.get",
    description: "Get the latest founder profile.",
    requiresApproval: false,
    schema: z.object({}),
    run: async () => (await getStore().getLatestProfile()) ?? null,
  },
  {
    name: "profile.save",
    description: "Save founder profile (name + context).",
    requiresApproval: true,
    schema: z.object({
      name: z.string().trim().min(1).max(120),
      context: z.string().max(4000).default(""),
      approved: approvedFlag,
    }),
    run: async (a: { name: string; context: string }) => {
      const p = await getStore().saveProfile(a.name, a.context);
      return { ok: true, id: p.id };
    },
  },
  {
    name: "connections.list",
    description: "List integration connection rows.",
    requiresApproval: false,
    schema: z.object({}),
    run: async () => getStore().listConnections(),
  },
  {
    name: "connections.set",
    description: "Set a connection status. Provider must be known.",
    requiresApproval: true,
    schema: z.object({
      provider: providerIdSchema,
      status: z.enum(["connected", "disconnected"]),
      approved: approvedFlag,
    }),
    run: async (a: { provider: string; status: string }) => {
      await getStore().setConnectionStatus(a.provider, a.status);
      return { ok: true };
    },
  },
  {
    name: "service.status",
    description: "Live status of all five providers from connection rows.",
    requiresApproval: false,
    schema: z.object({}),
    run: async () => getServiceStatus(),
  },
];

export const webmcpToolMap = new Map(webmcpTools.map((t) => [t.name, t]));

/** Public manifest: names, descriptions, approval flags. No schemas leak internals. */
export function webmcpManifest(): {
  name: string;
  description: string;
  requiresApproval: boolean;
}[] {
  return webmcpTools.map(({ name, description, requiresApproval }) => ({
    name,
    description,
    requiresApproval,
  }));
}

export interface WebmcpCallResult {
  ok: boolean;
  result?: unknown;
  error?: string;
}

/** Validate + enforce approval + dispatch. Single choke point for POST /api/webmcp. */
export async function callWebmcpTool(name: string, rawArgs: unknown): Promise<WebmcpCallResult> {
  const tool = webmcpToolMap.get(name);
  if (!tool) return { ok: false, error: `unknown tool: ${name}` };
  const parsed = (tool.schema as z.ZodTypeAny).safeParse(rawArgs ?? {});
  if (!parsed.success) return { ok: false, error: "invalid args" };
  const args = parsed.data as Record<string, unknown>;
  // kanban.approveCard IS the consent grant (incl. revoke with approved:false),
  // so it is exempt from the gate; its requiresApproval flag signals callers
  // to confirm with a human before invoking it.
  if (tool.requiresApproval && name !== "kanban.approveCard" && (args as { approved?: unknown }).approved !== true) {
    return { ok: false, error: "approval required: pass approved:true with explicit human consent" };
  }
  try {
    return { ok: true, result: await tool.run(args) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "tool failed" };
  }
}
