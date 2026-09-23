import { asc, desc, eq, sql } from "drizzle-orm";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { Pool } from "pg";
import * as schema from "./schema-pg";
import { nowIso, type AgentConfig, type Card, type CardPatch, type Store } from "./store";

function migrationsDir(): string | undefined {
  const candidates = [
    join(process.cwd(), "packages", "foundercycle", "drizzle", "pg"),
    join(process.cwd(), "..", "packages", "foundercycle", "drizzle", "pg"),
    join(process.cwd(), "..", "..", "packages", "foundercycle", "drizzle", "pg"),
  ];
  return candidates.find((c) => existsSync(c));
}

const PROVIDERS = ["gmail", "calendar", "notion", "slack", "github"];

export function createPostgresStore(url = process.env.DATABASE_URL!): Store {
  const pool = new Pool({ connectionString: url });
  const db: NodePgDatabase<typeof schema> = drizzle(pool, { schema });

  let ready: Promise<void> | null = null;
  const ensure = (): Promise<void> => {
    if (!ready) {
      ready = (async () => {
        const dir = migrationsDir();
        if (dir) await migrate(db, { migrationsFolder: dir });
        await seed();
      })();
    }
    return ready;
  };

  const seed = async () => {
    const now = nowIso();
    const projs = await db.select({ id: schema.projects.id }).from(schema.projects);
    if (projs.length === 0) {
      await db.insert(schema.projects).values({ name: "My First Project", createdAt: now });
    }
    for (const p of PROVIDERS) {
      await db
        .insert(schema.connections)
        .values({ provider: p, status: "disconnected", updatedAt: now })
        .onConflictDoNothing({ target: schema.connections.provider });
    }
    const cfg = await db.select().from(schema.agentConfig);
    if (cfg.length === 0) {
      await db.insert(schema.agentConfig).values({ id: 1, updatedAt: now });
    }
  };

  const store: Store = {
    backend: "postgres",

    async getNextCard(projectId?: number): Promise<Card | undefined> {
      await ensure();
      const rank = sql`case ${schema.cards.status} when 'planned' then 0 else 1 end`;
      const rows = await db
        .select()
        .from(schema.cards)
        .where(
          projectId === undefined
            ? sql`${schema.cards.status} in ('planned', 'ongoing')`
            : sql`${schema.cards.status} in ('planned', 'ongoing') and ${schema.cards.projectId} = ${projectId}`
        )
        .orderBy(rank, desc(schema.cards.priority), asc(schema.cards.id))
        .limit(1);
      return rows[0];
    },

    async listCards(status?: string): Promise<Card[]> {
      await ensure();
      if (status) {
        return db
          .select()
          .from(schema.cards)
          .where(eq(schema.cards.status, status))
          .orderBy(desc(schema.cards.priority), desc(schema.cards.id));
      }
      return db.select().from(schema.cards).orderBy(desc(schema.cards.priority), desc(schema.cards.id));
    },

    async listCardsByProject(projectId: number): Promise<Card[]> {
      await ensure();
      return db
        .select()
        .from(schema.cards)
        .where(eq(schema.cards.projectId, projectId))
        .orderBy(desc(schema.cards.priority), desc(schema.cards.id));
    },

    async createCard(title: string, type = "task", status = "planned", projectId = 1): Promise<number> {
      await ensure();
      const rows = await db
        .insert(schema.cards)
        .values({ title, type, status, projectId, createdAt: nowIso() })
        .returning({ id: schema.cards.id });
      return rows[0]!.id;
    },

    async updateCard(id: number, patch: CardPatch): Promise<void> {
      await ensure();
      const set: Partial<typeof schema.cards.$inferInsert> = {};
      if (patch.type !== undefined) set.type = patch.type;
      if (patch.status !== undefined) set.status = patch.status;
      if (patch.summary !== undefined) set.summary = patch.summary;
      if (patch.links !== undefined) set.linksJson = JSON.stringify(patch.links);
      if (patch.priority !== undefined) set.priority = patch.priority;
      if (patch.approvalFlag !== undefined) set.approvalFlag = patch.approvalFlag;
      if (Object.keys(set).length === 0) return;
      await db.update(schema.cards).set(set).where(eq(schema.cards.id, id));
    },

    async getLatestProfile() {
      await ensure();
      const rows = await db
        .select({ id: schema.profiles.id, name: schema.profiles.name, context: schema.profiles.context })
        .from(schema.profiles)
        .orderBy(desc(schema.profiles.id))
        .limit(1);
      return rows[0];
    },

    async saveProfile(name: string, context = "") {
      await ensure();
      const rows = await db
        .insert(schema.profiles)
        .values({ name, context, createdAt: nowIso() })
        .returning({ id: schema.profiles.id });
      return { id: rows[0]!.id, name, context };
    },

    async listConnections() {
      await ensure();
      return db
        .select({ provider: schema.connections.provider, status: schema.connections.status })
        .from(schema.connections)
        .orderBy(asc(schema.connections.provider));
    },

    async setConnectionStatus(provider: string, status: string): Promise<void> {
      await ensure();
      const now = nowIso();
      await db
        .insert(schema.connections)
        .values({ provider, status, updatedAt: now })
        .onConflictDoUpdate({
          target: schema.connections.provider,
          set: { status, updatedAt: now },
        });
    },

    async createRun(cardId: number, steps: string[], result: string): Promise<number> {
      await ensure();
      const rows = await db
        .insert(schema.runs)
        .values({ cardId, stepsJson: JSON.stringify(steps), result, createdAt: nowIso() })
        .returning({ id: schema.runs.id });
      return rows[0]!.id;
    },

    async getAgentConfig(): Promise<AgentConfig> {
      await ensure();
      const rows = await db.select().from(schema.agentConfig).limit(1);
      const row = rows[0];
      return {
        model: row?.model ?? "auto",
        approval_mode: row?.approvalMode === "auto" ? "auto" : "manual",
        review_threshold: typeof row?.reviewThreshold === "number" ? row.reviewThreshold : 0.5,
      };
    },

    async saveAgentConfig(cfg: Partial<AgentConfig>): Promise<AgentConfig> {
      await ensure();
      const cur = await store.getAgentConfig();
      const next: AgentConfig = {
        model: cfg.model ?? cur.model,
        approval_mode: cfg.approval_mode ?? cur.approval_mode,
        review_threshold: cfg.review_threshold ?? cur.review_threshold,
      };
      const now = nowIso();
      await db
        .insert(schema.agentConfig)
        .values({ id: 1, model: next.model, approvalMode: next.approval_mode, reviewThreshold: next.review_threshold, updatedAt: now })
        .onConflictDoUpdate({
          target: schema.agentConfig.id,
          set: { model: next.model, approvalMode: next.approval_mode, reviewThreshold: next.review_threshold, updatedAt: now },
        });
      return next;
    },

    async listProjects(includeArchived = false) {
      await ensure();
      const rows = await db
        .select({ id: schema.projects.id, name: schema.projects.name, archived: schema.projects.archived })
        .from(schema.projects)
        .orderBy(asc(schema.projects.id));
      return includeArchived ? rows : rows.filter((r) => r.archived === 0);
    },

    async createProject(name: string): Promise<number> {
      await ensure();
      const rows = await db
        .insert(schema.projects)
        .values({ name, createdAt: nowIso() })
        .returning({ id: schema.projects.id });
      return rows[0]!.id;
    },

    async renameProject(id: number, name: string): Promise<void> {
      await ensure();
      await db.update(schema.projects).set({ name }).where(eq(schema.projects.id, id));
    },

    async archiveProject(id: number, archived = true): Promise<void> {
      await ensure();
      await db.update(schema.projects).set({ archived: archived ? 1 : 0 }).where(eq(schema.projects.id, id));
    },

    async close(): Promise<void> {
      await pool.end();
    },
  };
  return store;
}
