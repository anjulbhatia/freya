/**
 * Integrations barrel. Gmail, Calendar, Meet, Notion, Slack, GitHub,
 * registry, agent flows, webmcp. Depends on `shared` + `db` only.
 */
export * from "./types";
export * from "./registry";
export * as gmail from "./gmail";
export * as calendar from "./calendar";
export * as meet from "./meet";
export * as notion from "./notion";
export * as github from "./github";
export * as slack from "./slack";
export * from "./agent/flows";
export * from "./agent/run";
export * from "./webmcp/tools";
export * from "./webmcp/health";
