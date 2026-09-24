import { HealthPanel } from "@/features/health/health-panel";

/**
 * Plain /health route. Deliberately ungated: no profile check, no
 * onboarding redirect. If the API or DB is down, this page is how
 * you see it.
 */
export default function HealthPage() {
  return (
    <div className="flex min-h-screen justify-center bg-background p-6">
      <div className="w-full max-w-lg">
        <h1 className="pb-3 text-lg tracking-tight">freya — system status</h1>
        <HealthPanel />
      </div>
    </div>
  );
}
