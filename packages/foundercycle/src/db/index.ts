import { createPostgresStore } from "./postgres-store";
import type { Store } from "./store";

/**
 * Postgres is the only backend. DATABASE_URL is required, e.g.
 * postgresql://foundercycle:foundercycle@localhost:5432/foundercycle
 */
export function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set. See .env.example.");
  }
  return url;
}

let store: Store | null = null;

export function getStore(): Store {
  if (!store) {
    store = createPostgresStore(getDatabaseUrl());
  }
  return store;
}

/** Test/seeding escape hatch. Resets the singleton. */
export function setStore(next: Store | null): void {
  store = next;
}
