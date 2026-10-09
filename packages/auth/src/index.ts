/**
 * Auth placeholder. No real session logic yet.
 * Webui keeps its own auth skeleton; promote it here when ready.
 */

export interface AuthUser {
  id: string;
  email?: string;
  name?: string;
}

export async function getSession(): Promise<{ user: AuthUser } | null> {
  // TODO: wire Auth.js / better-auth. Returns null until configured.
  return null;
}

export async function requireUser(): Promise<AuthUser> {
  const session = await getSession();
  if (!session) throw new Error("auth: no session (placeholder, not configured)");
  return session.user;
}
