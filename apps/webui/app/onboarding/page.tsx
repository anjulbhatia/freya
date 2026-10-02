"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Tick01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ProviderIcon } from "@/lib/app-icons";
import { PROVIDERS } from "@/lib/freya";
import { saveProfile, saveConnections } from "@/lib/store";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [context, setContext] = useState("");
  const [conns, setConns] = useState<Record<string, boolean>>({});
  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/profile", { cache: "no-store" })
      .then((r) => r.json())
      .then((p) => {
        if (p?.name) router.push("/");
        else setChecking(false);
      })
      .catch(() => setChecking(false));
  }, [router]);

  async function finish() {
    if (!name.trim() || saving) return;
    setSaving(true);
    saveProfile({ name: name.trim(), context });
    saveConnections(conns);
    try {
      await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), context }),
      });
      await Promise.all(
        Object.entries(conns)
          .filter(([, on]) => on)
          .map(([provider]) =>
            fetch("/api/connections", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ provider, status: "connected" }),
            })
          )
      );
    } catch {}
    router.push("/");
  }

  if (checking) return null;

  const live = Object.values(conns).filter(Boolean).length;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md rounded-2xl border-0 shadow-lg">
        <CardHeader>
          <CardTitle>{step === 1 ? "Founder setup" : "Connect apps"}</CardTitle>
          <CardDescription>
            {step === 1
              ? "Stored locally in ~/.freya."
              : `${live} of ${PROVIDERS.length} connected`}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2.5">
          {step === 1 ? (
            <>
              <Input
                placeholder="Founder name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-xl"
              />
              <Textarea
                placeholder="Context: company, focus, timezone…"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                rows={4}
                className="rounded-xl"
              />
              <Button disabled={!name.trim()} onClick={() => setStep(2)}>
                Continue
              </Button>
            </>
          ) : (
            <>
              {PROVIDERS.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 rounded-xl bg-muted/50 px-3 py-2.5"
                >
                  <span className="flex size-9 items-center justify-center rounded-full bg-card shadow-xs">
                    <ProviderIcon provider={p.id} className="size-5" />
                  </span>
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <span className="text-sm font-medium">{p.label}</span>
                    {conns[p.id] && (
                      <Badge variant="secondary" className="gap-0.5">
                        <HugeiconsIcon icon={Tick01Icon} strokeWidth={2} className="size-3" />
                        Live
                      </Badge>
                    )}
                  </div>
                  <Switch
                    checked={!!conns[p.id]}
                    onCheckedChange={() =>
                      setConns((c) => ({ ...c, [p.id]: !c[p.id] }))
                    }
                  />
                </div>
              ))}
              <div className="flex gap-2 pt-1">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button className="flex-1" onClick={finish} disabled={saving}>
                  {saving ? "Saving…" : "Enter Freya"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
