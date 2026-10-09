/** Shared shapes for all app integrations. Stubs now, WebMCP/OAuth later. */

export interface ToolResult {
  ok: boolean;
  /** Human-readable step for run logs. */
  step: string;
  /** Links to surface on the card. */
  links?: string[];
  detail?: string;
}

export interface RunContext {
  cardId: number;
  cardTitle: string;
  /** Explicit approval to send externally. Never true unless set on card/run. */
  approved: boolean;
  profileName: string;
}

export function mockLatency(): Promise<void> {
  return new Promise((r) => setTimeout(r, 30 + Math.random() * 80));
}
