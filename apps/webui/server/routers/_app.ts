import { router } from "@/server/trpc";
import { cardsRouter } from "@/server/routers/cards";
import { projectsRouter } from "@/server/routers/projects";
import { healthRouter } from "@/server/routers/health";

export const appRouter = router({
  cards: cardsRouter,
  projects: projectsRouter,
  health: healthRouter,
});

export type AppRouter = typeof appRouter;
