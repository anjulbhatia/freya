"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { HealthPanel } from "@/features/health/health-panel";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function HealthModal({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle>System status</DialogTitle>
          <DialogDescription>
            API and WebMCP health on one panel. Auto-refreshes every 30s.
          </DialogDescription>
        </DialogHeader>
        <HealthPanel enabled={open} />
      </DialogContent>
    </Dialog>
  );
}
