"use client";

export interface LibraryIdea {
  id: number;
  title: string;
  project: string;
}

interface CardRow {
  id: number;
  title: string;
  type: string;
  project_id: number;
}

interface ProjectRow {
  id: number;
  name: string;
}

export async function fetchLibraryIdeas(): Promise<LibraryIdea[]> {
  const [cards, projects] = await Promise.all([
    fetch("/api/cards", { cache: "no-store" }).then((r) => r.json()) as Promise<CardRow[]>,
    fetch("/api/projects", { cache: "no-store" }).then((r) => r.json()) as Promise<ProjectRow[]>,
  ]);
  const names = new Map(projects.map((p) => [p.id, p.name]));
  return cards
    .filter((c) => c.type === "idea")
    .map((c) => ({
      id: c.id,
      title: c.title,
      project: names.get(c.project_id) ?? "Unknown",
    }));
}
