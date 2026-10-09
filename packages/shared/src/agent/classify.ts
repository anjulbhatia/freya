import type { CardType } from "../types";

export interface Classification {
  type: CardType;
  confidence: number;
  reason: string;
}

/**
 * v0 deterministic classifier. Mirrors the chat heuristic so UI and
 * agent agree. Swap with an LLM call (CLASSIFY_PROMPT) when ready.
 */
export function classify(title: string): Classification {
  const t = title.toLowerCase().trim();

  if (/^idea\s*:/.test(t)) {
    return { type: "idea", confidence: 0.95, reason: "explicit idea prefix" };
  }
  if (/\b(fix|bug)\b/.test(t) || /pr\s*#\d+/.test(t)) {
    return { type: "bug", confidence: 0.9, reason: "bug/PR keywords" };
  }
  if (/\b(call|meet|meeting|sync|1:1|one-on-one)\b/.test(t)) {
    return { type: "meeting", confidence: 0.85, reason: "meeting keywords" };
  }
  if (/\b(send|follow[\s-]?up|remind|ping|nudge)\b/.test(t)) {
    return { type: "follow-up", confidence: 0.8, reason: "follow-up keywords" };
  }
  if (/\b(proposal|deadline|ship|review|draft|prepare|by\s+(monday|tuesday|wednesday|thursday|friday|eod|friday))\b/.test(t)) {
    return { type: "task", confidence: 0.75, reason: "task keywords" };
  }
  return { type: "task", confidence: 0.4, reason: "no signal, default task" };
}

/** Below this, the card stays for review instead of auto-acting. */
export const REVIEW_THRESHOLD = 0.5;
