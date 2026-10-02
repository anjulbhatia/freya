# Getting started

## Prerequisites

- Bun 1.3+ (`packageManager: bun@1.3.14`)
- Postgres 16+ running locally
- Node types + TS via Bun (no separate Node needed)

## Setup

```bash
cp .env.example .env
# edit DATABASE_URL, e.g. postgresql://freya:freya@localhost:5432/freya
bun install
bun run db:migrate   # runs drizzle migrations from packages/freya/drizzle/pg
bun run dev          # starts webui (Next.js) at http://localhost:3000
```

## Commands (root)

| Command | What |
|---|---|
| `bun run dev` | `webui` Next dev |
| `bun run build` / `start` | `webui` prod build / serve |
| `bun run lint` | `webui` eslint |
| `bun run typecheck` | `webui` + `freya` kernel `tsc --noEmit` |
| `bun run db:generate` | drizzle-kit generate (run in `packages/freya`) |
| `bun run db:migrate` | drizzle-kit migrate |

Workspaces: `apps/*`, `packages/*`. Bun `--filter` selects the package
(`webui`, `freya`). See `monorepo.md` for why no Turbo.

## Env

```bash
DATABASE_URL="postgresql://freya:freya@localhost:5432/freya"
FREYA_MODEL="auto"            # auto = deterministic classifier; LLM id later
FREYA_APPROVAL_MODE="manual"  # manual | auto
```

`DATABASE_URL` is required. Kernel throws if missing
(`packages/freya/src/db/index.ts:getDatabaseUrl`).

## First run checklist

1. `bun run dev`, open `/onboarding`, save profile.
2. Create a project (defaults to "My First Project" seed).
3. Add a card, e.g. `Call Bob at 3pm tomorrow about the pilot`.
4. Hit Process / `POST /api/agent/process-next` → card gets `Proposed ...` summary.
5. Approve on board (`kanban.approveCard`), process again → executes, links written back.
6. Check `/health` and `/api/webmcp` manifest for provider status.

No Postgres? Nothing works — store is Postgres-only (`Store.backend: "postgres"`).
There is no SQLite fallback despite what the old README said.
