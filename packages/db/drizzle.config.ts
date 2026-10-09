import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema-pg.ts",
  out: "./drizzle/pg",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      "postgresql://freya:freya@localhost:5432/freya",
  },
});
