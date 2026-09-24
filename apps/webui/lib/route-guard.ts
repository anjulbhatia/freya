"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getProfile } from "@/lib/store";

/**
 * All route-direction logic lives here, nowhere else.
 * Board and onboarding screens consume this hook; they never
 * call router.push themselves.
 *
 * Health/status UI is intentionally OUTSIDE the gate: it must
 * render before `ready` flips, so failures that block onboarding
 * (dead DB, dead API) stay visible instead of redirecting away.
 */
export interface ProfileGate {
  ready: boolean;
  founderName: string;
  setFounderName: (n: string) => void;
}

export function useProfileGate(): ProfileGate {
  const router = useRouter();
  const [founderName, setFounderName] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const p = (await fetch("/api/profile", { cache: "no-store" }).then((r) =>
          r.json()
        )) as { name?: string } | null;
        if (!cancelled && p?.name) {
          setFounderName(p.name);
          setReady(true);
          return;
        }
      } catch {}
      const local = getProfile();
      if (!cancelled) {
        if (!local) router.push("/onboarding");
        else {
          setFounderName(local.name);
          setReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return { ready, founderName, setFounderName };
}
