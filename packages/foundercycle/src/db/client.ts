/**
 * Back-compat facade. New code should import from `foundercycle/db/index`
 * (getStore) or `foundercycle/db/store` (types) directly.
 * All functions are async.
 */
import { getStore } from "./index";
import type {
  AgentConfig,
  Card,
  CardPatch,
  Connection,
  Profile,
  Project,
  Store,
} from "./store";

export type { AgentConfig, Card, CardPatch, Connection, Profile, Project, Store };

export function store(): Store {
  return getStore();
}

export const getNextCard = (...a: Parameters<Store["getNextCard"]>) => getStore().getNextCard(...a);
export const listCards = (...a: Parameters<Store["listCards"]>) => getStore().listCards(...a);
export const listCardsByProject = (...a: Parameters<Store["listCardsByProject"]>) =>
  getStore().listCardsByProject(...a);
export const createCard = (...a: Parameters<Store["createCard"]>) => getStore().createCard(...a);
export const updateCard = (...a: Parameters<Store["updateCard"]>) => getStore().updateCard(...a);

export const getLatestProfile = () => getStore().getLatestProfile();
export const saveProfile = (...a: Parameters<Store["saveProfile"]>) => getStore().saveProfile(...a);

export const listConnections = () => getStore().listConnections();
export const setConnectionStatus = (...a: Parameters<Store["setConnectionStatus"]>) =>
  getStore().setConnectionStatus(...a);

export const createRun = (...a: Parameters<Store["createRun"]>) => getStore().createRun(...a);

export const getAgentConfig = () => getStore().getAgentConfig();
export const saveAgentConfig = (...a: Parameters<Store["saveAgentConfig"]>) =>
  getStore().saveAgentConfig(...a);

export const listProjects = (...a: Parameters<Store["listProjects"]>) =>
  getStore().listProjects(...a);
export const createProject = (...a: Parameters<Store["createProject"]>) =>
  getStore().createProject(...a);
export const renameProject = (...a: Parameters<Store["renameProject"]>) =>
  getStore().renameProject(...a);
export const archiveProject = (...a: Parameters<Store["archiveProject"]>) =>
  getStore().archiveProject(...a);
