# WebMCP

External callers (and future LLM loop) use one surface:
`GET /api/webmcp` → manifest, `POST /api/webmcp { name, args }` → result.

Canonical table: `webmcpTools` in `packages/integrations/src/webmcp/tools.ts`.
Dispatcher: `callWebmcpTool(name, rawArgs)` — Zod-validates, enforces approval, runs.

## Approval rule

- Reads: `requiresApproval: false` (list/search/classify/status/get).
- Writes: `requiresApproval: true`. Executor rejects unless `args.approved === true`,
  error: `"approval required: pass approved:true with explicit human consent"`.
- Exception: `kanban.approveCard` IS the consent grant, so it bypasses the gate
  (its flag still signals callers to confirm with a human first).
- `agent.processNext` derives approval as `callFlag || autoMode || card.approvalFlag`
  but still requires the explicit arg to be marked gated.

## Tool list

Kanban: `kanban.listCards`, `kanban.getNext`, `kanban.createCard*`,
`kanban.updateCard*`, `kanban.moveCard*`, `kanban.approveCard*`.
Projects: `project.list`, `project.create*`, `project.rename*`, `project.archive*`.
Agent: `agent.classify`, `agent.processNext*`, `agent.getConfig`.
Gmail: `gmail.search`, `gmail.draft*`, `gmail.send*`.
Calendar: `calendar.listEvents`, `calendar.createEvent*`.
Notion: `notion.findContact`, `notion.createPage*`, `notion.append*`.
GitHub: `github.getPullRequest`, `github.createIssue*`.
Slack: `slack.postMessage*`.
Meta: `profile.get`, `profile.save*`, `connections.list`, `connections.set*`, `service.status`.

`*` = gated.

Health: `GET /api/*` + tRPC `health` router use `webmcp/health.ts`
(`apiChecks`, `webmcpChecks`, `getHealth`, `summarize`) for the `/health` panel.
UI client helper: `apps/webui/lib/webmcp.ts`.
