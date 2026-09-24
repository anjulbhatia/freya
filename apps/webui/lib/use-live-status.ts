"use client";

import { useCallback, useState } from "react";

type ServicesPayload = { ok: boolean }[] | { services?: { ok: boolean }[] };

function toLabel(payload: ServicesPayload): string {
  const ss = Array.isArray(payload) ? payload : (payload.services ?? []);
  return `${ss.filter((s) => s.ok).length}/${ss.length} live`;
}

/**
 * Connections map + "x/y live" label, shared by the board and the
 * connectors modal. Single fetch path so both stay in sync.
 */
export function useLiveStatus() {
  const [connections, setConnections] = useState<Record<string, boolean>>({});
  const [liveLabel, setLiveLabel] = useState("");

  const refresh = useCallback(async () => {
    try {
      const rows = (await fetch("/api/connections").then((r) => r.json())) as {
        provider: string;
        status: string;
      }[];
      const map: Record<string, boolean> = {};
      for (const r of rows) map[r.provider] = r.status === "connected";
      setConnections(map);
    } catch {}
    try {
      const payload = (await fetch("/api/webmcp").then((r) => r.json())) as ServicesPayload;
      setLiveLabel(toLabel(payload));
    } catch {}
  }, []);

  return { connections, setConnections, liveLabel, refreshLiveStatus: refresh };
}
