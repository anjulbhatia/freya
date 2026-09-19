"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { fetchLibraryIdeas, type LibraryIdea } from "./api";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function LibraryModal({ open, onOpenChange }: Props) {
  const [ideas, setIdeas] = useState<LibraryIdea[]>([]);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        setIdeas(await fetchLibraryIdeas());
      } catch {}
    })();
  }, [open ]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle>Library</DialogTitle>
          <DialogDescription>Every captured idea, across projects.</DialogDescription>
        </DialogHeader>
        <div className="fc-scroll flex max-h-80 flex-col gap-2 overflow-y-auto">
          {ideas.length === 0 && (
            <p className="py-6 text-center text-xs text-muted-foreground">
              No ideas yet. Prefix a card with “Idea:”.
            </p>
          )}
          {ideas.map((i) => (
            <div
              key={i.id}
              className="flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-2"
            >
              <span className="min-w-0 flex-1 truncate text-xs font-medium">{i.title}</span>
              <Badge variant="secondary">{i.project}</Badge>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
