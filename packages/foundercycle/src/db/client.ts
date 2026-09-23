import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { readFileSync, mkdirSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname } from "node:path";

let db: DatabaseSync | null = null;

/** DB lives outside the repo so clones stay clean. Override with FOUNDERCYCLE_DB_PATH. */
export function dbPath(): string {
  const p = process.env.FOUNDERCYCLE_DB_PATH;
  if (p) return p;
  return join(homedir(), ".foundercycle", "foundercycle.db");
}

const INLINE_SCHEMA = `
CREATE TABLE IF NOT EXISTS profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  context TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS connections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'disconnected',
  scopes TEXT DEFAULT '',
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS cards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'task',
  status TEXT NOT NULL DEFAULT 'planned',
  priority INTEGER DEFAULT 0,
  summary TEXT DEFAULT '',
  links_json TEXT DEFAULT '[]',
  approval_flag INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  card_id INTEGER REFERENCES cards(id) ON DELETE CASCADE,
  steps_json TEXT DEFAULT '[]',
  result TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS agent_config (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  model TEXT NOT NULL DEFAULT 'auto',
  approval_mode TEXT NOT NULL DEFAULT 'manual',
  review_threshold REAL NOT NULL DEFAULT 0.5,
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
`;

export function getDb(): DatabaseSync {
  if (db) return db;
  const path = dbPath();
  mkdirSync(dirname(path), { recursive: true });
  db = new DatabaseSync(path);
  db.exec("PRAGMA journal_mode = WAL;");
  const candidates = [
    join(process.cwd(), "packages", "foundercycle", "src", "db", "schema.sql"),
    join(process.cwd(), "..", "packages", "foundercycle", "src", "db", "schema.sql"),
    join(process.cwd(), "..", "..", "packages", "foundercycle", "src", "db", "schema.sql"),
  ];
  const schemaPath = candidates.find((c) => existsSync(c));
  const sql = schemaPath ? readFileSync(schemaPath, "utf-8") : INLINE_SCHEMA;
  db.exec(sql);
  // Lightweight migrations for existing ~/.foundercycle databases.
  try {
    db.exec("ALTER TABLE cards ADD COLUMN project_id INTEGER DEFAULT 1");
  } catch {}
  const providers = ["gmail", "calendar", "notion", "slack", "github"];
  const insert = db.prepare(
    "INSERT OR IGNORE INTO connections (provider, status) VALUES (?, 'disconnected')"
  );
  for (const p of providers) insert.run(p);
  db.prepare(
    "INSERT OR IGNORE INTO projects (id, name) VALUES (1, 'My First Project')"
  ).run();
  return db;
}

export type Profile = { id: number; name: string; context: string };
export type Connection = { provider: string; status: string };
export type Card = {
  id: number;
  title: string;
  type: string;
  status: string;
  priority: number;
  summary: string;
  links_json: string;
  approval_flag: number;
};

export function getLatestProfile(): Profile | undefined {
  return getDb()
    .prepare("SELECT id, name, context FROM profiles ORDER BY id DESC LIMIT 1")
    .get() as Profile | undefined;
}

/** Next actionable card: planned first, then ongoing, by priority. */
export function getNextCard(projectId?: number): Card | undefined {
  const db = getDb();
  if (projectId === undefined) {
    return db
      .prepare(
        `SELECT * FROM cards WHERE status IN ('planned', 'ongoing')
         ORDER BY CASE status WHEN 'planned' THEN 0 ELSE 1 END, priority DESC, id ASC LIMIT 1`
      )
      .get() as Card | undefined;
  }
  return db
    .prepare(
      `SELECT * FROM cards WHERE status IN ('planned', 'ongoing') AND project_id = ?
       ORDER BY CASE status WHEN 'planned' THEN 0 ELSE 1 END, priority DESC, id ASC LIMIT 1`
    )
    .get(projectId) as Card | undefined;
}

export function listCards(status?: string): Card[] {
  const database = getDb();
  if (status) {
    return database
      .prepare("SELECT * FROM cards WHERE status = ? ORDER BY priority DESC, id DESC")
      .all(status) as Card[];
  }
  return database
    .prepare("SELECT * FROM cards ORDER BY priority DESC, id DESC")
    .all() as Card[];
}

export function updateCard(
  id: number,
  patch: { type?: string; status?: string; summary?: string; links?: string[] }
): void {
  const sets: string[] = [];
  const params: SQLInputValue[] = [];
  if (patch.type !== undefined) {
    sets.push("type = ?");
    params.push(patch.type);
  }
  if (patch.status !== undefined) {
    sets.push("status = ?");
    params.push(patch.status);
  }
  if (patch.summary !== undefined) {
    sets.push("summary = ?");
    params.push(patch.summary);
  }
  if (patch.links !== undefined) {
    sets.push("links_json = ?");
    params.push(JSON.stringify(patch.links));
  }
  if (sets.length === 0) return;
  params.push(id);
  getDb().prepare(`UPDATE cards SET ${sets.join(", ")} WHERE id = ?`).run(...params);
}

export function createRun(cardId: number, steps: string[], result: string): number {
  const res = getDb()
    .prepare("INSERT INTO runs (card_id, steps_json, result) VALUES (?, ?, ?)")
    .run(cardId, JSON.stringify(steps), result);
  return Number(res.lastInsertRowid);
}

export function createCard(title: string, type = "task", status = "planned", projectId = 1): number {
  const res = getDb()
    .prepare("INSERT INTO cards (title, type, status, project_id) VALUES (?, ?, ?, ?)")
    .run(title, type, status, projectId);
  return Number(res.lastInsertRowid);
}

export function setConnectionStatus(provider: string, status: string): void {
  getDb()
    .prepare(
      "INSERT INTO connections (provider, status, updated_at) VALUES (?, ?, datetime('now')) ON CONFLICT(provider) DO UPDATE SET status=excluded.status, updated_at=datetime('now')"
    )
    .run(provider, status);
}

export interface AgentConfig {
  model: string;
  approval_mode: "manual" | "auto";
  review_threshold: number;
}

export function getAgentConfig(): AgentConfig {
  const row = getDb().prepare("SELECT * FROM agent_config WHERE id = 1").get() as
    | (AgentConfig & { id: number })
    | undefined;
  return {
    model: row?.model ?? "auto",
    approval_mode: row?.approval_mode === "auto" ? "auto" : "manual",
    review_threshold:
      typeof row?.review_threshold === "number" ? row.review_threshold : 0.5,
  };
}

export function saveAgentConfig(cfg: Partial<AgentConfig>): AgentConfig {
  const cur = getAgentConfig();
  const next: AgentConfig = {
    model: cfg.model ?? cur.model,
    approval_mode: cfg.approval_mode ?? cur.approval_mode,
    review_threshold: cfg.review_threshold ?? cur.review_threshold,
  };
  getDb()
    .prepare(
      "INSERT INTO agent_config (id, model, approval_mode, review_threshold, updated_at) VALUES (1, ?, ?, ?, datetime('now')) ON CONFLICT(id) DO UPDATE SET model=excluded.model, approval_mode=excluded.approval_mode, review_threshold=excluded.review_threshold, updated_at=datetime('now')"
    )
    .run(next.model, next.approval_mode, next.review_threshold);
  return next;
}

export interface Project {
  id: number;
  name: string;
  archived: number;
}

export function listProjects(includeArchived = false): Project[] {
  return getDb()
    .prepare(
      `SELECT id, name, archived FROM projects ${includeArchived ? "" : "WHERE archived = 0"} ORDER BY id ASC`
    )
    .all() as unknown as Project[];
}

export function createProject(name: string): number {
  const res = getDb().prepare("INSERT INTO projects (name) VALUES (?)").run(name);
  return Number(res.lastInsertRowid);
}

export function renameProject(id: number, name: string): void {
  getDb().prepare("UPDATE projects SET name = ? WHERE id = ?").run(name, id);
}

export function archiveProject(id: number, archived = true): void {
  getDb().prepare("UPDATE projects SET archived = ? WHERE id = ?").run(archived ? 1 : 0, id);
}
