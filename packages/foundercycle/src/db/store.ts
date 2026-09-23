/**
 * Store port. The agent, routers, and API routes program against this
 * interface only. Backed by Postgres via Drizzle. No raw SQL outside
 * the adapter.
 */

export interface Card {
  id: number;
  title: string;
  type: string;
  status: string;
  priority: number;
  summary: string;
  linksJson: string;
  approvalFlag: number;
  projectId: number;
  createdAt: string;
}

export interface CardPatch {
  type?: string;
  status?: string;
  summary?: string;
  links?: string[];
  priority?: number;
  approvalFlag?: number;
}

export interface Profile {
  id: number;
  name: string;
  context: string;
}

export interface Connection {
  provider: string;
  status: string;
}

export interface Project {
  id: number;
  name: string;
  archived: number;
}

export interface AgentConfig {
  model: string;
  approval_mode: "manual" | "auto";
  review_threshold: number;
}

export interface Store {
  readonly backend: "postgres";

  getNextCard(projectId?: number): Promise<Card | undefined>;
  listCards(status?: string): Promise<Card[]>;
  listCardsByProject(projectId: number): Promise<Card[]>;
  createCard(title: string, type?: string, status?: string, projectId?: number): Promise<number>;
  updateCard(id: number, patch: CardPatch): Promise<void>;

  getLatestProfile(): Promise<Profile | undefined>;
  saveProfile(name: string, context?: string): Promise<Profile>;

  listConnections(): Promise<Connection[]>;
  setConnectionStatus(provider: string, status: string): Promise<void>;

  createRun(cardId: number, steps: string[], result: string): Promise<number>;

  getAgentConfig(): Promise<AgentConfig>;
  saveAgentConfig(cfg: Partial<AgentConfig>): Promise<AgentConfig>;

  listProjects(includeArchived?: boolean): Promise<Project[]>;
  createProject(name: string): Promise<number>;
  renameProject(id: number, name: string): Promise<void>;
  archiveProject(id: number, archived?: boolean): Promise<void>;

  close(): Promise<void>;
}

export function nowIso(): string {
  return new Date().toISOString();
}
