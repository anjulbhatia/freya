# Freya mobile

Expo + React Native + NativeWind companion app. Capture surface for the
board: type work like you think it, it classifies locally and queues to
Planned. Server sync (tRPC) lands next.

## Run

```bash
bun install
bun run --filter mobile start   # scan QR with Expo Go
bun run --filter mobile android # emulator / device
bun run --filter mobile ios     # macOS only
bun run --filter mobile typecheck
```

Tailwind v4 via NativeWind: styles live in `global.css` (`@import
"tailwindcss"` + `@theme` tokens), wired through `metro.config.js`
(`withNativeWind`) and `babel.config.js`.
