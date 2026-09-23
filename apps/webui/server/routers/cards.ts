import { z } from "zod";
import { createCard, listCardsByProject, updateCard } from "foundercycle/db/client";
import { columnId, cardType, publicProcedure, router } from "@/server/trpc";

export const cardsRouter = router({
  listByProject: publicProcedure
    .input(z.object({ projectId: z.number().int().positive() }))
    .query(({ input }) => listCardsByProject(input.projectId)),
  create: publicProcedure
    .input(
      z.object({
        title: z.string().trim().min(1).max(2000),
        type: cardType.default("task"),
        status: columnId.default("planned"),
        projectId: z.number().int().positive().default(1),
      })
    )
    .mutation(({ input }) => ({
      id: createCard(input.title, input.type, input.status, input.projectId),
    })),
  update: publicProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        type: cardType.optional(),
        status: columnId.optional(),
        summary: z.string().max(2000).optional(),
        priority: z.number().int().optional(),
        approvalFlag: z.number().int().min(0).max(1).optional(),
      })
    )
    .mutation(({ input }) => {
      updateCard(input.id, {
        type: input.type,
        status: input.status,
        summary: input.summary,
        priority: input.priority,
        approvalFlag: input.approvalFlag,
      });
      return { ok: true };
    }),
});
