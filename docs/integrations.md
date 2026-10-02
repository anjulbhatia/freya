# Integrations

Five providers, ids owned by kernel (`ProviderId`):
`gmail`, `calendar` (Google), `notion`, `slack`, `github`.
Labels owned by UI (`apps/webui/lib/freya.ts:PROVIDERS`).

## Current status: stubs

All five modules in `packages/freya/src/integrations/` return canned
`ToolResult { ok, step, links? }` after `mockLatency()` (~30–110ms).
No OAuth, no network calls, no secrets. Safe for demo flows end-to-end.

- `gmail.ts`: `search` (read), `draft` (safe), `send(ctx)` — refuses unless `ctx.approved`.
- `calendar.ts`: `listEvents` (read), `createEvent(ctx)` — refuses unless approved, never overwrites (stub: always creates).
- `notion.ts`: `findContact` (read), `createPage(ctx)`, `append(ctx)` — writes refuse unless approved.
- `github.ts`: `getPullRequest(n)` (read), `createIssue(ctx)` — gated.
- `slack.ts`: `postMessage(ctx)` — gated. `flows.ts` uses channel `"eng"`.

`RunContext { cardId, cardTitle, approved, profileName }` threads approval.
`isConnected()` / `getServiceStatus()` (`registry.ts`) read `connections` rows —
status is just the seeded `disconnected`/`connected` flag, latency is the DB read time.

## Wiring real APIs (per provider)

1. Add env + OAuth: store tokens, never in repo. Extend `connections` row
   (`scopes`, token vault) or separate secrets table.
2. Replace stub function bodies with real SDK calls, keep signatures and
   `ToolResult` shape (`ok/step/links`). Keep `ctx.approved` guard on every write.
3. Flip status via `connections.set { provider, status: "connected" }` after OAuth callback.
4. Verify: `service.status` → ok, then run Flow A (meeting) and Flow B (bug) from `AGENTS.md`.

Suggested order: Notion (contact/page lookup, easiest) → Calendar (conflict check + create)
→ Gmail (draft first, send last) → GitHub (PR read, then issue write) → Slack (post last,
noisiest). Keep `mockLatency` behavior for tests or gate behind env.

## Connection UX

Onboarding + settings modals (`connect-modal.tsx`, `settings-modal.tsx`)
call `PROVIDERS` list + `connections` API. Currently flips local status only.
Real OAuth needs callback routes under `app/api/connections/*` — not yet built.
