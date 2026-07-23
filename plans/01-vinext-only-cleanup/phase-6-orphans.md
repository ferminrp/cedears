# Phase 6. Orphan theme dep + metadata generator

Back: [overview.md](./overview.md)

## Goal

Stop depending on `next-themes` without a provider. Stop advertising `generator: Next.js` in HTML metadata.

## Changes

**Files:** `components/ui/sonner.tsx`, `package.json`, `app/layout.tsx`

1. `components/ui/sonner.tsx` — remove `useTheme` import and call. Pass a fixed theme (e.g. `theme="system"` or omit and let Sonner default). Keep icon and style props.
2. `package.json` — remove `next-themes` from dependencies. Run `pnpm install` so the lockfile updates.
3. `app/layout.tsx` — remove `generator: 'Next.js'` from metadata, or set `generator: 'vinext'`. Prefer **remove** (less noise in SERP metadata).

Do not add a ThemeProvider. No dark-mode product work.

## Data structures

None.

## Verification

**Static.** Grep: zero `next-themes` / `useTheme` in source. `pnpm install` + `pnpm run cf:build`.

**Runtime.** Trigger a toast on a client page if easy; otherwise load any page that mounts `<Toaster />` and confirm no client console error about missing ThemeProvider.

## Implementer

Composer 2.5-fast. Commit: `chore: remove next-themes and Next.js generator metadata`.
