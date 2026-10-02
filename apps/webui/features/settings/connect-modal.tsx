"use client";

import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Tick01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { ProviderIcon } from "@/lib/app-icons";
import { PROVIDERS } from "@/lib/freya";
import { saveConnections } from "@/lib/store";

const BLURB: Record<string, string> = {
  gmail: "Drafts and sends with approval. Read threads for context.",
  calendar: "Conflict checks and event creation. Never overwrites.",
  notion: "Contacts, notes, ideas and action logs.",
  slack: "Optional pings for triaged work.",
  github: "PR context and light issue filing.",
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  connections: Record<string, boolean>;
  onSave: (c: Record<string, boolean>) => void;
}

export function ConnectModal({ open, onOpenChange, connections, onSave }: Props) {
  const [draft, setDraft] = useState(connections);

  useEffect(() => {
    if (open) setDraft(connections);
  }, [open, connections]);

  function toggle(id: string) {
    setDraft((d) => ({ ...d, [id]: !d[id] }));
  }

  async function save() {
    onSave(draft);
    saveConnections(draft);
    await Promise.all(
      Object.entries(draft).map(([provider, on]) =>
        fetch("/api/connections", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ provider, status: on ? "connected" : "disconnected" }),
        }).catch(() => {})
      )
    );
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle>Connect apps</DialogTitle>
          <DialogDescription>
            Toggle what the agent may use. OAuth wiring comes next.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          {PROVIDERS.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 rounded-xl bg-muted/50 px-3 py-2.5"
            >
              <span className="flex size-9 items-center justify-center rounded-full bg-card shadow-xs">
                <ProviderIcon provider={p.id} className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{p.label}</span>
                  {draft[p.id] && (
                    <Badge variant="secondary" className="gap-0.5">
                      <HugeiconsIcon icon={Tick01Icon} strokeWidth={2} className="size-3" />
                      Live
                    </Badge>
                  )}
                </div>
                <p className="truncate text-[11px] text-muted-foreground">
                  {BLURB[p.id]}
                </p>
              </div>
              <Switch
                checked={!!draft[p.id]}
                onCheckedChange={() => toggle(p.id)}
              />
            </div>
          ))}
          <Button onClick={save}>Save connections</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
