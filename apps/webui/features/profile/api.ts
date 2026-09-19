"use client";

export interface Profile {
  name: string;
  context: string;
}

export async function fetchProfile(): Promise<Profile | null> {
  const p = (await fetch("/api/profile", { cache: "no-store" }).then((r) =>
    r.json()
  )) as Partial<Profile> | null;
  if (!p) return null;
  return { name: p.name ?? "", context: p.context ?? "" };
}

export async function saveProfile(p: Profile): Promise<void> {
  await fetch("/api/profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(p),
  });
}
