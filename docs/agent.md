# Agent loop

Core: `processNext(approved, projectId?)` in `packages/integrations/src/agent/run.ts`.

```
getNextCard → getAgentConfig + classify + getLatestProfile
  → confidence < review_threshold? → write "Needs review", stay, createRun, return
  → else runFlow(type, title, {approved: callFlag || cfg auto || card.approvalFlag})
  → updateCard(type, status=outcome.nextStatus, summary, links) + createRun
```

## Classifier

Deterministic regex (`src/agent/classify.ts`). No LLM yet (`FREYA_MODEL=auto`).

| Signal | Type | Conf |
|---|---|---|
| `^idea:` | idea | 0.95 |
| `fix|bug` or `PR #n` | bug | 0.90 |
| `call|meet|meeting|sync|1:1` | meeting | 0.85 |
| `send|follow-up|remind|ping|nudge` | follow-up | 0.80 |
| `proposal|deadline|ship|review|draft|prepare|by <day>` | task | 0.75 |
| else | task | 0.40 (→ review) |

Threshold default `0.5` (`REVIEW_THRESHOLD`, `agent_config.review_threshold`).
Below threshold: card untouched except `type + summary = Needs review ...`,
run logged, `ran:true` with no external calls. Chat panel mirrors this
heuristic so UI and agent agree.

Swap path: `CLASSIFY_PROMPT` in `src/agent/prompts.ts` is ready; replace
`classify()` body with LLM call when `FREYA_MODEL != auto`.

## Flows

`src/agent/flows.ts`. Every flow checks `ctx.approved` first.
Unapproved → return `{ nextStatus: "planned", summary: "Proposed (needs approval): ..." }`.
No external write happens. This is the human-in-the-loop guarantee.

- **meeting**: `notion.findContact` + `calendar.listEvents` (always run, read-only),
  then if approved `calendar.createEvent` + `gmail.draft`. → `ongoing`.
- **bug**: `github.getPullRequest(n)` if `#n` in title, then if approved
  `notion.createPage(Engineering)` + `slack.postMessage(eng)`. → `ongoing`.
- **task**: if approved `calendar.createEvent(Deadline: …)` + `gmail.draft` + `notion.append`. → `ongoing`.
- **follow-up**: if approved `gmail.draft` + `notion.append`. Send always needs approval. → `ongoing`.
- **idea**: if approved `notion.createPage(Ideas)`. → `completed` (only flow that completes).

Failures: `collect()` checks `ToolResult.ok`. Any failure → downgrade to
`Proposed ... incomplete; see run log`, stay in `planned`.

## Approval sources (OR)

1. `processNext(approved=true)` call flag / WebMCP `agent.processNext {approved:true}`.
2. `agent_config.approval_mode = "auto"`.
3. `cards.approval_flag = 1` via `kanban.approveCard` (the board Approve button).

`SYSTEM_PROMPT` / `FLOW_PROMPTS` (`src/agent/prompts.ts`) restate hard rules:
never send without approval, never overwrite calendar events, always write
summary back, minimum tool calls, low confidence → review.

## Prompts

- `SYSTEM_PROMPT`: operating agent, small verifiable steps, propose-first.
- `CLASSIFY_PROMPT`: `{"type","confidence","reason"}` JSON.
- `FLOW_PROMPTS`: per-type step lists consumed by future LLM runner.
