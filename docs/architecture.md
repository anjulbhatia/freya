# Architecture

## Layout

```
apps/webui/            Next.js App Router + tRPC + REST. UI only.
  app/                 routes, layouts, /api/* (thin wrappers)
  app/api/             cards, projects, agent/*, connections, profile, webmcp
  server/routers/      tRPC routers: cards, projects, health (+ _app)
  server/trpc.ts       tRPC init, domain enum re-exports
  features/            chat, kanban, health, library, profile, projects, settings
  lib/freya.ts         UI constants: PROVIDERS, COLUMNS, PIPELINES, NEXT_COLUMN
  lib/trpc.ts, store.ts, webmcp.ts, app-icons.tsx
packages/shared/       Domain kernel. Pure: types, schemas, classify, prompts. No deps.
packages/db/           Postgres store. Drizzle schema, adapter, client facade.
packages/integrations/ Gmail, Calendar, Meet, Notion, Slack, GitHub + agent flows + webmcp.
  src/agent/           flows.ts, run.ts (orchestration; imports shared + db)
  src/integrations/    types.ts, registry.ts + gmail/calendar/meet/notion/github/slack stubs
  src/webmcp/          tools.ts (canonical tool table), health.ts
packages/auth/         Auth placeholder. No session logic yet.
packages/ui/           Shared UI placeholder. Webui owns components for now.
```

Packages: `shared`, `db`, `integrations`, `auth` (placeholder), `ui` (placeholder).
Webui imports via tsconfig paths (`db/*`, `shared/*`, `integrations/*`).
UI helper via `@/lib/freya`. Import direction is one-way: **webui → packages**.

## Request paths

- **tRPC** (`/api/trpc/*`): cards, projects, health. Used by React Query hooks.
- **REST** (`/api/*`): thin wrappers over kernel `getStore()` / `processNext()`:
  `cards`, `projects`, `agent/process-next`, `agent/config`, `connections`, `profile`.
- **WebMCP** (`/api/webmcp`, GET manifest / POST dispatch):
  single choke point `callWebmcpTool(name, args)` in `packages/integrations/src/webmcp/tools.ts`.
  Validates with Zod, enforces `requiresApproval` gate, then dispatches.

## Key types

Shared owns domain enums (`packages/shared/src/types.ts` + `schemas.ts`):
`CardType = meeting | task | bug | idea | follow-up`,
`ColumnId = planned | ongoing | completed`,
`ProviderId = gmail | calendar | meet | notion | slack | github`.

UI owns labels (`apps/webui/lib/freya.ts`):
`COLUMNS = planned→Tasks, ongoing→Running, completed→Done`.
`PIPELINES` maps card type → provider order for the UI pipeline display.
`STAGE_INDEX` / `NEXT_COLUMN` drive column progression.

## Data flow (one card)

```
UI card create → store.createCard
  → agent.processNext → store.getNextCard (planned first, priority desc)
  → classify(title) → confidence check
  → runFlow(type, title, {approved}) → stub integrations
  → store.updateCard(type/status/summary/links) + store.createRun(steps, result)
  → board re-renders, card shows summary + links
```

`runs` table is the audit log. `cards.summary` + `linksJson` are the proof surface.
