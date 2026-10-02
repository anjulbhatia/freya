"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight01Icon,
  Calendar01Icon,
  Tick01Icon,
} from "@hugeicons/core-free-icons";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProviderIcon } from "@/lib/app-icons";
import {
  NEXT_COLUMN,
  PIPELINES,
  STAGE_INDEX,
  type KanbanCard as CardData,
} from "@/lib/freya";
import { cn } from "cn";

const TYPE_PILL: Record<CardData["type"], string> = {
  meeting: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  bug: "bg-red-500/15 text-red-700 dark:text-red-300",
  task: "bg-amber-500/20 text-amber-700 dark:text-amber-300",
  "follow-up": "bg-teal-500/15 text-teal-700 dark:text-teal-300",
  idea: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
};

const TYPE_EDGE: Record<CardData["type"], string> = {
  meeting: "bg-sky-500",
  bug: "bg-red-500",
  task: "bg-amber-500",
  "follow-up": "bg-teal-500",
  idea: "bg-violet-500",
};

export function KanbanCard({
  card,
  onAdvance,
}: {
  card: CardData;
  onAdvance: (id: string) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const pipeline = PIPELINES[card.type];
  const active = STAGE_INDEX[card.column];
  const next = NEXT_COLUMN[card.column];
  const doneCount = Math.min(active, pipeline.length);
  const proposed = (card.summary ?? "").startsWith("Proposed");
  const date = card.createdAt
    ? new Date(card.createdAt.replace(" ", "T")).toLocaleDateString([], {
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <Card
      size="sm"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", card.id);
        e.dataTransfer.effectAllowed = "move";
        setDragging(true);
      }}
      onDragEnd={() => setDragging(false)}
      className={cn(
        "group relative cursor-grab overflow-hidden bg-card shadow-(--surface-shadow) ring-1 transition-all active:cursor-grabbing",
        proposed
          ? "ring-2 ring-warning/60"
          : "ring-surface-border hover:shadow-(--floating-shadow) hover:ring-primary/30",
        dragging && "scale-[0.98] opacity-50 shadow-(--floating-shadow)"
      )}
    >
      <span
        aria-hidden
        className={cn("absolute inset-y-0 left-0 w-1", TYPE_EDGE[card.type])}
      />
      <CardContent className="flex flex-col gap-2 py-3 pl-4">
        <p className="text-label leading-snug font-medium">{card.title}</p>

        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-micro font-medium",
              TYPE_PILL[card.type]
            )}
          >
            {card.type}
          </span>
          {proposed && (
            <span className="rounded-full bg-warning/15 px-2 py-0.5 text-micro font-semibold text-warning">
              awaiting approval
            </span>
          )}
          {date && (
            <span className="flex items-center gap-1 text-micro text-muted-foreground">
              <HugeiconsIcon icon={Calendar01Icon} strokeWidth={2} className="size-3" />
              {date}
            </span>
          )}
          {next && (
            <Button
              variant="ghost"
              size="icon-xs"
              className="ml-auto opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
              onClick={() => onAdvance(card.id)}
              aria-label={`Move to ${next}`}
              title={`Move to ${next}`}
            >
              <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
            </Button>
          )}
        </div>

        {card.summary && (
          <p className="line-clamp-3 text-caption leading-snug text-muted-foreground">
            {card.summary}
          </p>
        )}

        <div className="flex items-center gap-1 pt-0.5" aria-label="Process stage">
          {pipeline.map((provider, i) => {
            const done = i < doneCount;
            const current = i === doneCount && next !== null;
            return (
              <span key={provider} className="flex items-center gap-1">
                {i > 0 && (
                  <span
                    className={cn(
                      "h-px w-2.5",
                      i <= doneCount ? "bg-primary" : "bg-border"
                    )}
                  />
                )}
                <span
                  title={provider}
                  className={cn(
                    "relative flex size-6 items-center justify-center rounded-full",
                    done && "bg-primary/10 ring-1 ring-primary/40",
                    current && "bg-surface-raised shadow-(--surface-shadow) ring-2 ring-primary/40",
                    !done && !current && "bg-muted opacity-60"
                  )}
                >
                  <ProviderIcon provider={provider} className="size-3.5" />
                  {done && (
                    <span className="absolute -right-1 -bottom-1 flex size-3 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <HugeiconsIcon icon={Tick01Icon} strokeWidth={2} className="size-2" />
                    </span>
                  )}
                </span>
              </span>
            );
          })}
          <span className="ml-1 text-micro text-muted-foreground">
            {next === null ? "Done" : `Step ${doneCount + 1}/${pipeline.length}`}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
