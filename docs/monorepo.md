# Monorepo: why no Turbo

Verdict: **keep sleek Bun workspaces. No Turbo right now.**

## Current setup (enough)

- Bun workspaces (`apps/*`, `packages/*`), two members: `webui`, `freya`.
- Root scripts use `bun run --filter <pkg> <script>`. Fast, zero config.
- Bun install is already fast; Next build dominates CI time, Turbo would not fix that
  without remote cache.
- Dependency graph is trivial: `webui → freya`, no diamond, no pipeline ordering needs.

## What Turbo would add (cost > benefit today)

- Extra `turbo.json`, pipeline definitions, version pinning, CI cache config.
- Local cache hits help only with 4+ packages or expensive codegen/lint matrices.
  With 2 packages, `bun --filter` + Next cache is equivalent.
- Risk: another daemon/config to keep in sync with Bun's own filtering semantics.

## When to add Turbo

- ≥4 workspace packages, or shared `ui` / `config` packages with build dependencies.
- CI minutes hurt and remote cache (Vercel) would actually dedupe builds.
- Need ordered pipelines (`db:generate → build → test`) across packages with `dependsOn`.

Migration then is cheap: `bunx turbo init`, move root scripts into `turbo.json`
`tasks: { build: { dependsOn: ["^build"] }, typecheck, lint }`, keep `--filter`
for ad-hoc runs. Until then, stay sleek.
