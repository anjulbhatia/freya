"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { parseAsInteger, useQueryState } from "nuqs";
import { trpc } from "@/lib/trpc";
import { Sidebar } from "@/features/navigation/sidebar";
import { LibraryModal } from "@/features/library";
import { ConnectModal } from "@/features/settings/connect-modal";
import { SettingsModal } from "@/features/settings/settings-modal";
import { ProfileModal } from "@/features/profile";
import type { Project } from "@/features/projects/api";
import { HugeiconsIcon } from "@hugeicons/react";
import { PanelRightIcon } from "@hugeicons/core-free-icons";
import { ChatPanel } from "@/features/chat/chat-panel";
import { KanbanColumn } from "@/features/kanban/kanban-column";
import { getProfile } from "@/lib/store";
import type { CardType, ColumnId, KanbanCard } from "@/lib/foundercycle";
import type { Card as CardRow } from "foundercycle/db/client";
import { NEXT_COLUMN } from "@/lib/foundercycle";
import { cn } from "cn";

const VALID_TYPES: CardType[] = ["meeting", "task", "bug", "idea", "follow-up"];
const VALID_COLUMNS: ColumnId[] = ["planned", "ongoing", "completed"];

function toCard(r: CardRow): KanbanCard {
  return {
    id: String(r.id),
    title: r.title,
    type: VALID_TYPES.includes(r.type as CardType) ? (r.type as CardType) : "task",
    column: VALID_COLUMNS.includes(r.status as ColumnId)
      ? (r.status as ColumnId)
      : "planned",
    summary: r.summary || undefined,
    createdAt: r.createdAt,
  };
}

export default function Home() {
  return (
    <Suspense>
      <Board />
    </Suspense>
  );
}

function Board() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [ready, setReady] = useState(false);
  const [activeId, setActiveId] = useQueryState("project", parseAsInteger);
  const [query, setQuery] = useQueryState("q", { defaultValue: "" });
  const [collapsed, setCollapsed] = useState(false);
  const [boardHidden, setBoardHidden] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [connections, setConnections] = useState<Record<string, boolean>>({});
  const [liveLabel, setLiveLabel] = useState("");

  const utils = trpc.useUtils();
  const projectsQuery = trpc.projects.list.useQuery(undefined, { enabled: ready });
  const projects: Project[] = projectsQuery.data ?? [];
  const cardsQuery = trpc.cards.listByProject.useQuery(
    { projectId: activeId ?? 0 },
    { enabled: ready && activeId !== null }
  );
  const cards = ((cardsQuery.data ?? []) as CardRow[]).map(toCard);

  function invalidateCards() {
    utils.cards.listByProject.invalidate();
  }
  // Chat width as % of main area. Hard floor: never under a third.
  const [chatPct, setChatPct] = useState(34);
  const [resizing, setResizing] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const dragRef = useRef<{ startX: number; startPct: number } | null>(null);

  const reload = () => {
    invalidateCards();
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const p = (await fetch("/api/profile", { cache: "no-store" }).then((r) =>
          r.json()
        )) as { name?: string } | null;
        if (!cancelled && p?.name) {
          setName(p.name);
          setReady(true);
          return;
        }
      } catch {}
      const local = getProfile();
      if (!cancelled) {
        if (!local) router.push("/onboarding");
        else {
          setName(local.name);
          setReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (ready) reload();
  }, [ready]);

  // Default to the first project once loaded and none selected.
  useEffect(() => {
    if (!ready || projectsQuery.isLoading || activeId !== null) return;
    const first = projects[0];
    if (first) setActiveId(first.id);
  }, [ready, projectsQuery.isLoading, projects, activeId, setActiveId]);

  // If the active project vanished (archived), fall back to the first.
  useEffect(() => {
    if (!ready || projectsQuery.isLoading || activeId === null) return;
    if (!projects.find((p) => p.id === activeId) && projects[0]) {
      setActiveId(projects[0].id);
    }
  }, [ready, projectsQuery.isLoading, projects, activeId, setActiveId]);

  useEffect(() => {
    if (!ready) return;
    fetch("/api/connections")
      .then((r) => r.json())
      .then((rows: { provider: string; status: string }[]) => {
        const map: Record<string, boolean> = {};
        for (const r of rows) map[r.provider] = r.status === "connected";
        setConnections(map);
      })
      .catch(() => {});
    fetch("/api/webmcp")
      .then((r) => r.json())
      .then((ss: { ok: boolean }[]) => {
        setLiveLabel(`${ss.filter((s) => s.ok).length}/${ss.length} live`);
      })
      .catch(() => {});
  }, [ready]);

  const createCardMut = trpc.cards.create.useMutation({
    onSuccess: () => invalidateCards(),
  });
  const updateCardMut = trpc.cards.update.useMutation({
    onSuccess: () => invalidateCards(),
  });
  const createProjectMut = trpc.projects.create.useMutation({
    onSuccess: (r) => {
      utils.projects.list.invalidate();
      setActiveId(r.id);
    },
  });
  const renameProjectMut = trpc.projects.rename.useMutation({
    onSuccess: () => utils.projects.list.invalidate(),
  });
  const archiveProjectMut = trpc.projects.archive.useMutation({
    onSuccess: () => utils.projects.list.invalidate(),
  });

  async function handleCreate(c: KanbanCard) {
    if (activeId === null) return;
    createCardMut.mutate({
      title: c.title,
      type: c.type,
      status: "planned",
      projectId: activeId,
    });
  }

  async function handleAdvance(id: string) {
    const card = cards.find((c) => c.id === id);
    const next = card ? NEXT_COLUMN[card.column] : null;
    if (!card || !next) return;
    updateCardMut.mutate({ id: Number(id), status: next });
  }

  async function handleMove(id: string, column: ColumnId) {
    const card = cards.find((c) => c.id === id);
    if (!card || card.column === column) return;
    updateCardMut.mutate({ id: Number(id), status: column });
  }

  function handleSelectProject(id: number) {
    setActiveId(id);
  }

  function handleNewProject(projectName: string) {
    createProjectMut.mutate({ name: projectName });
  }

  function handleRenameProject(id: number, projectName: string) {
    renameProjectMut.mutate({ id, name: projectName });
  }

  function handleArchiveProject(id: number) {
    archiveProjectMut.mutate({ id });
  }

  if (!ready) return null;

  const planned = cards.filter((c) => c.column === "planned");
  const ongoing = cards.filter((c) => c.column === "ongoing");
  const completed = cards.filter((c) => c.column === "completed");
  const active = projects.find((p) => p.id === activeId);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
        query={query}
        onQueryChange={setQuery}
        projects={projects}
        activeId={activeId}
        onSelect={handleSelectProject}
        onCreate={handleNewProject}
        onRename={handleRenameProject}
        onArchive={handleArchiveProject}
        onOpenAutomations={() => setSettingsOpen(true)}
        onOpenLibrary={() => setLibraryOpen(true)}
        onOpenConnectors={() => setConnectOpen(true)}
        onOpenProfile={() => setProfileOpen(true)}
        inboxItems={planned.map((c) => ({ id: c.id, title: c.title }))}
        onAdvanceCard={handleAdvance}
        founderName={name}
        webmcpLabel={liveLabel}
      />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="flex h-12 flex-none items-center px-4">
          <div className="truncate text-sm font-semibold">
            {active ? active.name : "FounderCycle"}
          </div>
        </div>
      <main ref={mainRef} className="flex min-h-0 flex-1 gap-0 overflow-hidden px-3 pb-3">
        <section
          style={boardHidden ? undefined : { width: `${chatPct}%` }}
          className={
            boardHidden
              ? "flex min-h-0 min-w-0 flex-1 flex-col rounded-2xl bg-muted/40 p-2"
              : "flex min-h-0 min-w-0 flex-none flex-col rounded-2xl bg-muted/40 p-2"
          }
        >
          <div className="flex items-center gap-2 px-2 pt-1 pb-2">
            <span className="text-[13px] font-semibold">Assistant</span>
          </div>
          <div className="min-h-0 min-w-0 flex-1 px-1">
            <ChatPanel onCreate={handleCreate} />
          </div>
        </section>

        {!boardHidden && (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize chat and board. Click to hide board."
          title="Drag to resize. Click to hide board."
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") setBoardHidden(true);
          }}
          onPointerDown={(e) => {
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
            dragRef.current = { startX: e.clientX, startPct: chatPct };
            setResizing(true);
          }}
          onPointerMove={(e) => {
            const d = dragRef.current;
            const el = mainRef.current;
            if (!d || !el) return;
            const w = el.getBoundingClientRect().width;
            if (w <= 0) return;
            const next = d.startPct + ((e.clientX - d.startX) / w) * 100;
            setChatPct(Math.min(60, Math.max(33, next)));
          }}
          onPointerUp={(e) => {
            const d = dragRef.current;
            dragRef.current = null;
            setResizing(false);
            if (d && Math.abs(e.clientX - d.startX) < 5) setBoardHidden(true);
          }}
          onPointerCancel={() => {
            dragRef.current = null;
            setResizing(false);
          }}
          className="group mx-1 flex w-3 flex-none cursor-col-resize touch-none items-center justify-center bg-transparent outline-none"
        >
          <span
            className={cn(
              "h-10 w-1.5 rounded-full bg-border transition-opacity duration-150",
              resizing ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )}
          />
        </div>
        )}

        {boardHidden && (
          <button
            onClick={() => setBoardHidden(false)}
            aria-label="Show board"
            title="Show board"
            className="ml-1 flex w-6 flex-none cursor-pointer flex-col items-center justify-center rounded-2xl bg-muted/40 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <HugeiconsIcon icon={PanelRightIcon} strokeWidth={2} className="size-4" />
          </button>
        )}

        {!boardHidden && (
        <section className="min-h-0 min-w-0 flex-1 overflow-x-auto">
          <div className="grid h-full min-h-0 grid-cols-[repeat(3,minmax(230px,1fr))] gap-3">
            <div className="min-h-0 min-w-0">
              <KanbanColumn
                title="Tasks"
                column="planned"
                cards={planned}
                onAdvance={handleAdvance}
                onMove={handleMove}
                onQuickAdd={(_, title) =>
                  handleCreate({ id: crypto.randomUUID(), title, type: "task", column: "planned" })
                }
              />
            </div>
            <div className="min-h-0 min-w-0">
              <KanbanColumn
                title="Running"
                column="ongoing"
                cards={ongoing}
                onAdvance={handleAdvance}
                onMove={handleMove}
                onQuickAdd={(_, title) =>
                  handleCreate({ id: crypto.randomUUID(), title, type: "task", column: "planned" })
                }
              />
            </div>
            <div className="min-h-0 min-w-0">
              <KanbanColumn
                title="Done"
                column="completed"
                cards={completed}
                onAdvance={handleAdvance}
                onMove={handleMove}
                onQuickAdd={(_, title) =>
                  handleCreate({ id: crypto.randomUUID(), title, type: "task", column: "planned" })
                }
              />
            </div>
          </div>
        </section>
        )}
      </main>
      </div>

      <ConnectModal
        open={connectOpen}
        onOpenChange={setConnectOpen}
        connections={connections}
        onSave={(c) => {
          setConnections(c);
          fetch("/api/webmcp")
            .then((r) => r.json())
            .then((ss: { ok: boolean }[]) => {
              setLiveLabel(`${ss.filter((s) => s.ok).length}/${ss.length} live`);
            })
            .catch(() => {});
        }}
      />
      <SettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />
      <ProfileModal
        open={profileOpen}
        onOpenChange={setProfileOpen}
        onProfileSaved={(n) => setName(n)}
      />
      <LibraryModal open={libraryOpen} onOpenChange={setLibraryOpen} />
    </div>
  );
}
