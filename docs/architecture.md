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
packages/freya/        Agent kernel. UI-agnostic. No webui imports.
  src/agent/           classify.ts, flows.ts, run.ts, prompts.ts
  src/integrations/    types.ts, registry.ts + gmail/calendar/notion/github/slack stubs
  src/db/              store.ts (port), client.ts (facade), index.ts, postgres-store.ts, schema-pg.ts
  src/webmcp/          tools.ts (canonical tool table), health.ts
  src/types.ts, schemas.ts, index.ts (barrel)
```

Package name: `freya`. Import via `freya/*`
(tsconfig path: `freya/* → ../../packages/freya/src/*`).
UI helper via `@/lib/freya`. Import direction is one-way: **webui → kernel**.

## Request paths

- **tRPC** (`/api/trpc/*`): cards, projects, health. Used by React Query hooks.
- **REST** (`/api/*`): thin wrappers over kernel `getStore()` / `processNext()`:
  `cards`, `projects`, `agent/process-next`, `agent/config`, `connections`, `profile`.
- **WebMCP** (`/api/webmcp`, GET manifest / POST dispatch):
  single choke point `callWebmcpTool(name, args)` in `packages/freya/src/webmcp/tools.ts`.
  Validates with Zod, enforces `requiresApproval` gate, then dispatches.

## Key types

Kernel owns domain enums (`src/types.ts` + `src/schemas.ts`):
`CardType = meeting | task | bug | idea | follow-up`,
`ColumnId = planned | ongoing | completed`,
`ProviderId = gmail | calendar | notion | slack | github`.

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
