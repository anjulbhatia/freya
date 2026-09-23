import { getStore } from "../db/index";
import { classify } from "./classify";
import { runFlow } from "./flows";

export interface ProcessResult {
  ran: boolean;
  cardId?: number;
  type?: string;
  summary?: string;
  reason?: string;
}

/**
 * Core loop, one card: read next → classify → act → write back → move.
 * Low confidence → card stays, review note written, nothing external sent.
 */
export async function processNext(approved = false, projectId?: number): Promise<ProcessResult> {
  const store = getStore();
  const card = await store.getNextCard(projectId);
  if (!card) return { ran: false, reason: "no open cards" };

  const cfg = await store.getAgentConfig();
  const c = classify(card.title);
  const profile = await store.getLatestProfile();

  if (c.confidence < cfg.review_threshold) {
    const summary = `Needs review (${c.type}, ${(c.confidence * 100).toFixed(0)}%): ${c.reason}. Left in place.`;
    await store.updateCard(card.id, { type: c.type, summary });
    await store.createRun(card.id, [`classify: ${c.reason}`], summary);
    return { ran: true, cardId: card.id, type: c.type, summary };
  }

  const outcome = await runFlow(c.type, card.title, {
    cardId: card.id,
    cardTitle: card.title,
    approved: approved || cfg.approval_mode === "auto" || card.approvalFlag === 1,
    profileName: profile?.name ?? "",
  });

  await store.updateCard(card.id, {
    type: c.type,
    status: outcome.nextStatus,
    summary: outcome.summary,
    links: outcome.links,
  });
  await store.createRun(
    card.id,
    [`classify: ${c.type} (${c.reason})`, ...outcome.links.map((l) => `link: ${l}`)],
    outcome.summary
  );

  return { ran: true, cardId: card.id, type: c.type, summary: outcome.summary };
}
