import { z } from "zod";

/**
 * Canonical domain schemas. Single source of truth.
 * UI (tRPC routers, API routes) must import these, never redefine enums.
 */
export const cardTypeSchema = z.enum(["meeting", "task", "bug", "idea", "follow-up"]);
export const columnIdSchema = z.enum(["planned", "ongoing", "completed"]);
export const providerIdSchema = z.enum(["gmail", "calendar", "notion", "slack", "github"]);

export type CardTypeSchema = z.infer<typeof cardTypeSchema>;
export type ColumnIdSchema = z.infer<typeof columnIdSchema>;
export type ProviderIdSchema = z.infer<typeof providerIdSchema>;
