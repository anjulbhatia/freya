import { initTRPC } from "@trpc/server";
import { cardTypeSchema, columnIdSchema } from "foundercycle/schemas";

const t = initTRPC.create();

export const router = t.router;
export const publicProcedure = t.procedure;

/** Canonical domain enums. Single source: foundercycle kernel. */
export const cardType = cardTypeSchema;
export const columnId = columnIdSchema;
