import { integer, pgTable, real, text } from "drizzle-orm/pg-core";

/**
 * Postgres schema (Drizzle). Timestamps are ISO strings set in app code
 * so rows serialize identically wherever they are read.
 */
export const profiles = pgTable("profiles", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  context: text("context").notNull().default(""),
  createdAt: text("created_at").notNull(),
});

export const connections = pgTable("connections", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  provider: text("provider").notNull().unique(),
  status: text("status").notNull().default("disconnected"),
  scopes: text("scopes").notNull().default(""),
  updatedAt: text("updated_at").notNull(),
});

export const cards = pgTable("cards", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  title: text("title").notNull(),
  type: text("type").notNull().default("task"),
  status: text("status").notNull().default("planned"),
  priority: integer("priority").notNull().default(0),
  summary: text("summary").notNull().default(""),
  linksJson: text("links_json").notNull().default("[]"),
  approvalFlag: integer("approval_flag").notNull().default(0),
  projectId: integer("project_id").notNull().default(1),
  createdAt: text("created_at").notNull(),
});

export const runs = pgTable("runs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  cardId: integer("card_id").references(() => cards.id, { onDelete: "cascade" }),
  stepsJson: text("steps_json").notNull().default("[]"),
  result: text("result").notNull().default(""),
  createdAt: text("created_at").notNull(),
});

export const agentConfig = pgTable("agent_config", {
  id: integer("id").primaryKey(),
  model: text("model").notNull().default("auto"),
  approvalMode: text("approval_mode").notNull().default("manual"),
  reviewThreshold: real("review_threshold").notNull().default(0.5),
  updatedAt: text("updated_at").notNull(),
});

export const projects = pgTable("projects", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  archived: integer("archived").notNull().default(0),
  createdAt: text("created_at").notNull(),
});
