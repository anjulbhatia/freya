"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { KanbanCard } from "@/features/kanban/kanban-card";
import type { KanbanCard as CardData, ColumnId } from "@/lib/freya";
import { cn } from "cn";

interface Props {
  title: string;
  column: ColumnId;
  cards: CardData[];
  onAdvance: (id: string) => void;
  onMove: (id: string, column: ColumnId) => void;
  onQuickAdd: (column: ColumnId, title: string) => void;
}

export function KanbanColumn({ title, column, cards, onAdvance, onMove, onQuickAdd }: Props) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [over, setOver] = useState(false);

  function submit() {
    const t = draft.trim();
    if (!t) return;
    onQuickAdd(column, t);
    setDraft("");
    setAdding(false);
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const id = e.dataTransfer.getData("text/plain");
        if (id) onMove(id, column);
      }}
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden rounded-2xl bg-surface p-2 shadow-(--surface-shadow) ring-1 ring-surface-border transition-all",
        over && "bg-surface-selected ring-2 ring-primary/50 ring-inset"
      )}
    >
      <div className="flex items-center gap-2 px-2 pt-1 pb-2">
        <span className="text-label font-semibold">{title}</span>
        <span className="rounded-full bg-muted px-1.5 py-0.5 text-micro font-medium text-muted-foreground">
          {cards.length}
        </span>
      </div>
      <ScrollArea className="fc-scroll min-h-0 flex-1 px-1">
        <div className="flex flex-col gap-2 pb-1">
          {cards.map((c) => (
            <KanbanCard key={c.id} card={c} onAdvance={onAdvance} />
          ))}
          {cards.length === 0 && !adding && (
            <div className="flex flex-col items-center gap-1 px-2 py-8 text-center">
              <p className="text-caption font-medium text-muted-foreground">
                Nothing here yet
              </p>
              <p className="text-micro text-faint-foreground">
                Drag a card in or add one below
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
      {adding ? (
        <div className="flex items-center gap-1 px-1 pt-2">
          <Input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
              if (e.key === "Escape") setAdding(false);
            }}
            placeholder="Card title…"
            className="h-8 rounded-xl border-0 bg-surface-raised shadow-(--surface-shadow)"
          />
          <Button size="sm" onClick={submit} disabled={!draft.trim()}>
            Add
          </Button>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="mt-1 justify-start text-muted-foreground"
          onClick={() => setAdding(true)}
        >
          <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} />
          Add new
        </Button>
      )}
    </div>
  );
}
