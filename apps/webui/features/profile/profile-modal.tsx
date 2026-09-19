"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { fetchProfile, saveProfile } from "./api";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onProfileSaved?: (name: string) => void;
}

export function ProfileModal({ open, onOpenChange, onProfileSaved }: Props) {
  const [name, setName] = useState("");
  const [context, setContext] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!open) return;
    fetchProfile()
      .then((p) => {
        if (p) {
          setName(p.name);
          setContext(p.context);
        }
      })
      .catch(() => {});
  }, [open ]);

  async function save() {
    const trimmed = name.trim();
    if (!trimmed) return;
    await saveProfile({ name: trimmed, context }).catch(() => {});
    onProfileSaved?.(trimmed);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1500);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle>Profile</DialogTitle>
          <DialogDescription>
            Who the agent is working for. Stored in ~/.foundercycle.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Founder name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ada" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Context</Label>
            <Textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={3}
              placeholder="Company, focus, timezone…"
            />
          </div>
        </div>
        <Button onClick={save} disabled={!name.trim()}>
          {saved ? "Saved" : "Save profile"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
