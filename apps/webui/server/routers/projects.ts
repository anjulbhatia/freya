import { z } from "zod";
import {
  archiveProject,
  createProject,
  listProjects,
  renameProject,
} from "foundercycle/db/client";
import { publicProcedure, router } from "@/server/trpc";

export const projectsRouter = router({
  list: publicProcedure.query(() => listProjects()),
  create: publicProcedure
    .input(z.object({ name: z.string().trim().min(1).max(120) }))
    .mutation(async ({ input }) => ({ id: await createProject(input.name) })),
  rename: publicProcedure
    .input(z.object({ id: z.number().int().positive(), name: z.string().trim().min(1).max(120) }))
    .mutation(async ({ input }) => {
      await renameProject(input.id, input.name);
      return { ok: true };
    }),
  archive: publicProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      await archiveProject(input.id, true);
      return { ok: true };
    }),
});
