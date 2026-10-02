# Database

Postgres-only. Drizzle ORM. No SQLite, no fallback.

- Schema: `packages/freya/src/db/schema-pg.ts`
- Adapter: `src/db/postgres-store.ts` (implements `Store` port in `src/db/store.ts`)
- Access: `getStore()` singleton in `src/db/index.ts` (requires `DATABASE_URL`);
  `src/db/client.ts` is a back-compat facade — new code uses `getStore()`.
- Config: `packages/freya/drizzle.config.ts`, migrations in `packages/freya/drizzle/pg/`.
  Migration dir lookup tries `cwd/packages/freya/drizzle/pg` + two parent variants
  so `migrate()` works from root or `apps/webui`.

## Tables

| Table | Purpose |
|---|---|
| `projects` | id, name, archived, createdAt. Seed: "My First Project". |
| `cards` | title, type, status (`planned|ongoing|completed`), priority, summary, linksJson, approvalFlag, projectId. `getNextCard` picks `planned` first, then priority desc, id asc. |
| `runs` | cardId FK cascade, stepsJson, result, createdAt. Audit log, one row per `processNext`. |
| `profiles` | name, context. `getLatestProfile` = max id. |
| `connections` | provider unique, status, scopes. Seeded `disconnected` × 5. |
| `agent_config` | single row id=1: model (`auto`), approval_mode, review_threshold (0.5). |

Timestamps are ISO strings set in app code (`nowIso()`), not DB defaults.

## Commands

```bash
bun run db:generate  # drizzle-kit generate (from packages/freya)
bun run db:migrate   # drizzle-kit migrate — auto-runs on first store use via ensure()+seed()
```

`ensure()` migrates + seeds (default project, 5 connections, agent_config) lazily
on first query, so a fresh DB self-initializes. `close()` ends the pg pool (tests).

## Notes / gotchas

- `DATABASE_URL` change (`freya` user/db) requires fresh DB or manual rename;
  old `foundercycle` databases will not migrate automatically.
- `linksJson` / `stepsJson` are JSON-encoded text columns — parse on read.
- `approvalFlag` is int 0/1, set only via `kanban.approveCard`.
