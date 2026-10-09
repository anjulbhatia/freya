# Freya docs

Start here. Freya = one project → chat + Kanban → agent proposes → human approves → agent executes → proof written back to card.

- `getting-started.md` – prerequisites, env, DB, dev commands. Read first.
- `architecture.md` – monorepo layout, kernel vs webui, request flow.
- `agent.md` – classify → propose → approve → execute. Confidence gating, flows.
- `integrations.md` – Gmail, Calendar, Meet, Notion, Slack, GitHub. Current stub status, how to wire real APIs.
- `database.md` – Postgres + Drizzle schema, migrations, seed.
- `monorepo.md` – why Bun workspaces, no Turbo (yet). When to add it.
- `webmcp.md` – tool table, approval gate, `POST /api/webmcp` contract.
- `ui.md` – tokens, button/dialog/layout/card contract.

Source of truth: `AGENTS.md` (product spec), `packages/shared/src`, `packages/db/src`, `packages/integrations/src`, `apps/webui`.
