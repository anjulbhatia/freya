"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { RefreshIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { ProviderIcon } from "@/lib/app-icons";
import type { ProviderId } from "@/lib/foundercycle";
import { trpc } from "@/lib/trpc";
import { cn } from "cn";

export type HealthStatus = "operational" | "degraded" | "down";

const DOT: Record<HealthStatus, string> = {
  operational: "bg-emerald-500",
  degraded: "bg-amber-500",
  down: "bg-red-500",
};

const LABEL: Record<HealthStatus, string> = {
  operational: "Operational",
  degraded: "Degraded",
  down: "Down",
};

const BADGE: Record<HealthStatus, "secondary" | "outline" | "destructive"> = {
  operational: "secondary",
  degraded: "outline",
  down: "destructive",
};

export interface HealthCheck {
  name: string;
  group: string;
  ok: boolean;
  latencyMs: number;
  detail: string;
}

function providerOf(name: string): ProviderId | null {
  if (!name.startsWith("provider/")) return null;
  const id = name.slice("provider/".length);
  return (["gmail", "calendar", "notion", "slack", "github"] as const).includes(
    id as ProviderId
  )
    ? (id as ProviderId)
    : null;
}

function Row({ check }: { check: HealthCheck }) {
  const provider = providerOf(check.name);
  return (
    <div className="flex items-center gap-3 rounded-xl bg-muted/50 px-3 py-2">
      {provider ? (
        <span className="flex size-7 items-center justify-center rounded-full bg-card shadow-xs">
          <ProviderIcon provider={provider} className="size-4" />
        </span>
      ) : (
        <span
          className={cn(
            "size-2 shrink-0 rounded-full",
            check.ok ? "bg-emerald-500" : "bg-red-500"
          )}
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-medium">{check.name}</div>
        <div className="truncate text-[11px] text-muted-foreground">
          {check.detail}
        </div>
      </div>
      <span className="shrink-0 text-[11px] text-muted-foreground">
        {check.latencyMs}ms
      </span>
      <Badge variant={check.ok ? "secondary" : "destructive"}>
        {check.ok ? "Up" : "Down"}
      </Badge>
    </div>
  );
}

/** Shared status panel body. Used by the modal and the /health route. */
export function HealthPanel({ enabled = true }: { enabled?: boolean }) {
  const query = trpc.health.all.useQuery(undefined, {
    enabled,
    refetchInterval: 30000,
    refetchOnWindowFocus: false,
  });
  const data = query.data as
    | { status: HealthStatus; checkedAt: string; checks: HealthCheck[] }
    | undefined;
  const status: HealthStatus = data?.status ?? "operational";
  const checks = data?.checks ?? [];
  const api = checks.filter((c) => c.group === "api");
  const webmcp = checks.filter((c) => c.group === "webmcp");

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2.5 rounded-xl bg-muted/50 px-3 py-2.5">
        <span className="relative flex size-2.5">
          <span
            className={cn(
              "absolute inline-flex h-full w-full animate-ping rounded-full opacity-60",
              DOT[status]
            )}
          />
          <span
            className={cn("relative inline-flex size-2.5 rounded-full", DOT[status])}
          />
        </span>
        <span className="text-sm font-semibold">
          {query.isLoading ? "Checking…" : LABEL[status]}
        </span>
        <Badge variant={BADGE[status]} className="ml-auto">
          {api.filter((c) => c.ok).length}/{api.length} api ·{" "}
          {webmcp.filter((c) => c.ok).length}/{webmcp.length} webmcp
        </Badge>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => query.refetch()}
          disabled={query.isFetching}
          aria-label="Refresh status"
        >
          {query.isFetching ? (
            <Spinner className="size-4" />
          ) : (
            <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} />
          )}
        </Button>
      </div>

      {query.isLoading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-xs text-muted-foreground">
          <Spinner className="size-4" />
          Probing api and webmcp…
        </div>
      ) : query.isError ? (
        <div className="rounded-xl bg-destructive/10 px-3 py-4 text-center text-[13px] text-destructive">
          Status unreachable. Is the app server running?
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div>
            <div className="px-1 pb-1.5 text-xs font-medium text-muted-foreground">
              API
            </div>
            <div className="flex flex-col gap-1.5">
              {api.map((c) => (
                <Row key={c.name} check={c} />
              ))}
              {api.length === 0 && (
                <p className="px-1 text-[11px] text-muted-foreground">
                  No api checks reported.
                </p>
              )}
            </div>
          </div>
          <Separator />
          <div>
            <div className="px-1 pb-1.5 text-xs font-medium text-muted-foreground">
              WebMCP
            </div>
            <div className="flex flex-col gap-1.5">
              {webmcp.map((c) => (
                <Row key={c.name} check={c} />
              ))}
              {webmcp.length === 0 && (
                <p className="px-1 text-[11px] text-muted-foreground">
                  No webmcp checks reported.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {data && (
        <p className="text-center text-[11px] text-muted-foreground">
          Last checked {new Date(data.checkedAt).toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}
