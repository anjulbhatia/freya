"use client";

import { useState, type ReactElement } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDown01Icon,
  FoldersIcon,
  InboxIcon,
  MoreHorizontalIcon,
  PanelLeftIcon,
  Plug01Icon,
  PlusSignIcon,
  Search01Icon,
  ZapIcon,
} from "@hugeicons/core-free-icons";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
} from "@/components/ui/context-menu";
import { ThemeToggle } from "@/features/navigation/theme-toggle";
import type { Project } from "@/features/projects/api";
import { cn } from "cn";

export interface InboxItem {
  id: string;
  title: string;
}

interface Props {
  collapsed: boolean;
  onToggleCollapse: () => void;
  query: string;
  onQueryChange: (q: string) => void;
  projects: Project[];
  activeId: number | null;
  onSelect: (id: number) => void;
  onCreate: (name: string) => void;
  onRename: (id: number, name: string) => void;
  onArchive: (id: number) => void;
  onOpenAutomations: () => void;
  onOpenLibrary: () => void;
  onOpenConnectors: () => void;
  onOpenProfile: () => void;
  inboxItems: InboxItem[];
  onAdvanceCard: (id: string) => void;
  founderName: string;
  webmcpLabel: string;
}

const navItem =
  "flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-[13px] text-muted-foreground transition-colors hover:bg-card hover:text-foreground hover:shadow-xs";

function Tip({ label, children }: { label: string; children: ReactElement }) {
  return (
    <Tooltip>
      <TooltipTrigger render={children} />
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

export function Sidebar({
  collapsed,
  onToggleCollapse,
  query,
  onQueryChange,
  projects,
  activeId,
  onSelect,
  onCreate,
  onRename,
  onArchive,
  onOpenAutomations,
  onOpenLibrary,
  onOpenConnectors,
  onOpenProfile,
  inboxItems,
  onAdvanceCard,
  founderName,
  webmcpLabel,
}: Props) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [renaming, setRenaming] = useState<number | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [projectsOpen, setProjectsOpen] = useState(true);

  const visible = projects.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase())
  );

  function submitNew() {
    const name = draft.trim();
    if (!name) return;
    onCreate(name);
    setDraft("");
    setAdding(false);
  }

  function submitRename(id: number) {
    const name = renameDraft.trim();
    if (name) onRename(id, name);
    setRenaming(null);
  }

  function projectMenu(id: number, name: string) {
    return (
      <>
        <DropdownMenuItem
          onClick={() => {
            setRenaming(id);
            setRenameDraft(name);
          }}
        >
          Rename
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onArchive(id)}>Archive</DropdownMenuItem>
      </>
    );
  }

  return (
    <TooltipProvider>
    <aside
      className={cn(
        "flex min-h-0 flex-none flex-col gap-1 overflow-hidden bg-muted/40 p-2 transition-[width] duration-200",
        collapsed ? "w-14 items-center" : "w-48"
      )}
    >
      <div
        className={cn(
          "flex items-center px-2",
          collapsed ? "justify-center" : "justify-between"
        )}
      >
        {!collapsed && (
          <div
            className={cn(
              "px-2 text-2xl leading-none",
              
            )}
          >
            <h1 className="leadning-none text-lg tracking-tight">
            freya
            </h1>
          </div>
        )}
        <Tip label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
          <button
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
          >
            <HugeiconsIcon icon={PanelLeftIcon} strokeWidth={2} className="size-4" />
          </button>
        </Tip>
      </div>

      {!collapsed ? (
        <div className="flex items-center gap-2 rounded-xl bg-card px-2.5 py-2 shadow-xs border dark:border-2 border-muted/40">
          <HugeiconsIcon icon={Search01Icon} strokeWidth={2} className="size-4 shrink-0 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search"
            className="w-full min-w-0 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground"
          />
        </div>
      ) : (
        <Tip label="Search">
          <button
            onClick={onToggleCollapse}
            aria-label="Search"
            className="flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
          >
            <HugeiconsIcon icon={Search01Icon} strokeWidth={2} className="size-4" />
          </button>
        </Tip>
      )}

      {!collapsed ? (
        adding ? (
          <div className="flex items-center gap-1 mt-2">
            <Input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitNew();
                if (e.key === "Escape") setAdding(false);
              }}
              placeholder="Project name…"
              className="h-8 rounded-xl border-0 bg-card shadow-xs"
            />
            <button
              onClick={submitNew}
              disabled={!draft.trim()}
              className="rounded-xl bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
            >
              Add
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-2.5 py-2 text-[13px] mt-2 font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} className="size-4 shrink-0" />
            New Project
          </button>
        )
      ) : (
        <Tip label="New Project">
          <button
            onClick={() => {
              onToggleCollapse();
              window.setTimeout(() => setAdding(true), 200);
            }}
            aria-label="New Project"
            className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground"
          >
            <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} className="size-4" />
          </button>
        </Tip>
      )}

      <Tip label="Automations">
        <button className={cn(navItem, collapsed && "justify-center px-0")} onClick={onOpenAutomations}>
          <HugeiconsIcon icon={ZapIcon} strokeWidth={2} className="size-4 shrink-0" />
          {!collapsed && "Automations"}
        </button>
      </Tip>
      <Tip label="Library">
        <button className={cn(navItem, collapsed && "justify-center px-0")} onClick={onOpenLibrary}>
          <HugeiconsIcon icon={FoldersIcon} strokeWidth={2} className="size-4 shrink-0" />
          {!collapsed && "Library"}
        </button>
      </Tip>
      <Tip label="Connectors">
        <button className={cn(navItem, collapsed && "justify-center px-0")} onClick={onOpenConnectors}>
          <HugeiconsIcon icon={Plug01Icon} strokeWidth={2} className="size-4 shrink-0" />
          {!collapsed && (
            <>
              Connectors
              <span className="ml-auto text-[10px] text-muted-foreground">{webmcpLabel}</span>
            </>
          )}
        </button>
      </Tip>


      {!collapsed && (
        <div className="flex min-h-0 flex-col">
          <button
            onClick={() => setProjectsOpen((o) => !o)}
            aria-expanded={projectsOpen}
            className="flex w-full items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Projects
            <HugeiconsIcon
              icon={ArrowDown01Icon}
              strokeWidth={2}
              className={cn("size-3.5 transition-transform", !projectsOpen && "-rotate-90")}
            />
          </button>
          {projectsOpen && (
            <div className="fc-scroll max-h-56 min-h-0 overflow-y-auto">
              <div className="flex flex-col gap-0.5">
                {visible.map((p) => (
                  <ContextMenu key={p.id}>
                    <ContextMenuTrigger>
                      <div
                        onClick={() => onSelect(p.id)}
                        className={cn(
                          "group flex cursor-pointer items-center gap-2 rounded-xl px-2 py-1.5 text-[11px]",
                          p.id === activeId
                            ? "bg-card font-medium shadow-xs"
                            : "text-muted-foreground hover:bg-card/60 hover:text-foreground"
                        )}
                      >
                        {renaming === p.id ? (
                          <Input
                            autoFocus
                            value={renameDraft}
                            onChange={(e) => setRenameDraft(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") submitRename(p.id);
                              if (e.key === "Escape") setRenaming(null);
                            }}
                            onBlur={() => setRenaming(null)}
                            onClick={(e) => e.stopPropagation()}
                            className="h-7 rounded-lg border-0 bg-background"
                          />
                        ) : (
                          <>
                            <span className="min-w-0 flex-1 truncate">{p.name}</span>
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                render={
                                  <Tip label="Project options">
                                    <button
                                      aria-label={`${p.name} options`}
                                      className="flex size-6 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-muted"
                                    >
                                      <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} className="size-3.5" />
                                    </button>
                                  </Tip>
                                }
                              />
                              <DropdownMenuContent align="end">
                                {projectMenu(p.id, p.name)}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </>
                        )}
                      </div>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem
                        onClick={() => {
                          setRenaming(p.id);
                          setRenameDraft(p.name);
                        }}
                      >
                        Rename
                      </ContextMenuItem>
                      <ContextMenuItem onClick={() => onArchive(p.id)}>
                        Archive
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                ))}
                {visible.length === 0 && (
                  <p className="px-2 py-4 text-center text-[9px] text-muted-foreground">
                    No projects match
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-auto flex flex-col gap-1">
        {!collapsed ? (
          <div className="flex items-center gap-2 rounded-xl bg-card px-2 py-1.5 shadow-xs">
            <button
              onClick={onOpenProfile}
              title={founderName || "Profile settings"}
              className="flex size-7 flex-none items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground"
            >
              {founderName ? founderName.charAt(0).toUpperCase() : "F"}
            </button>
            <button
              onClick={onOpenProfile}
              className="min-w-0 flex-1 truncate text-left text-[13px] font-medium"
            >
              {founderName || "Profile"}
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Tip label="Inbox">
                    <button
                      aria-label="Inbox"
                      className="relative flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <HugeiconsIcon icon={InboxIcon} strokeWidth={2} className="size-4" />
                      {inboxItems.length > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                          {inboxItems.length > 9 ? "9+" : inboxItems.length}
                        </span>
                      )}
                    </button>
                  </Tip>
                }
              />
              <DropdownMenuContent align="end" className="w-64">
                {inboxItems.length === 0 && (
                  <p className="px-2 py-3 text-center text-[11px] text-muted-foreground">
                    Inbox zero. Capture something.
                  </p>
                )}
                {inboxItems.map((item) => (
                  <DropdownMenuItem
                    key={item.id}
                    onClick={() => onAdvanceCard(item.id)}
                    className="text-xs"
                  >
                    <span className="truncate">{item.title}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <ThemeToggle />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <ThemeToggle />
            <Tip label={founderName || "Profile"}>
              <button
                onClick={onOpenProfile}
                aria-label={founderName || "Profile"}
                className="flex size-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground"
              >
                {founderName ? founderName.charAt(0).toUpperCase() : "F"}
              </button>
            </Tip>
          </div>
        )}
      </div>
    </aside>
    </TooltipProvider>
  );
}
