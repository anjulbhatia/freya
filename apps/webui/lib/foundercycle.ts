import type { CardType, ColumnId, ProviderId } from "foundercycle/types";

export type { CardType, ColumnId, ProviderId };

/** UI labels for kernel provider ids. Labels live here, ids live in kernel. */
export const PROVIDERS = [
  { id: "gmail", label: "Gmail" },
  { id: "calendar", label: "Google Calendar" },
  { id: "notion", label: "Notion" },
  { id: "slack", label: "Slack" },
  { id: "github", label: "GitHub" },
] as const satisfies readonly { id: ProviderId; label: string }[];

/** Default board titles. Later user-configurable per board. */
export const COLUMNS = [
  { id: "planned", label: "Tasks" },
  { id: "ongoing", label: "Running" },
  { id: "completed", label: "Done" },
] as const satisfies readonly { id: ColumnId; label: string }[];

export interface KanbanCard {
  id: string;
  title: string;
  type: CardType;
  column: ColumnId;
  summary?: string;
  createdAt?: string;
}

/** App pipeline per card type: where the process travels. */
export const PIPELINES: Record<CardType, ProviderId[]> = {
  meeting: ["notion", "calendar", "gmail"],
  bug: ["github", "notion", "slack"],
  task: ["calendar", "gmail", "notion"],
  "follow-up": ["calendar", "gmail", "notion"],
  idea: ["notion", "github"],
};

/** Active stage index per column. Completed = all done. */
export const STAGE_INDEX: Record<ColumnId, number> = {
  planned: 0,
  ongoing: 1,
  completed: Number.MAX_SAFE_INTEGER,
};

export const NEXT_COLUMN: Record<ColumnId, ColumnId | null> = {
  planned: "ongoing",
  ongoing: "completed",
  completed: null,
};
