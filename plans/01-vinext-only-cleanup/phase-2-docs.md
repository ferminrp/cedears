# Phase 2. Docs match vinext-only

Back: [overview.md](./overview.md)

## Goal

Docs describe a single workflow. No code changes.

## Changes

**Files:** `README.md`, `AGENTS.md`

- State that the app runs on vinext (Vite) targeting Cloudflare Workers.
- Document `pnpm dev` (port 3000), `pnpm build`, `pnpm start`, `pnpm deploy`, and the `cf:*` CI scripts.
- Remove “Next.js (default)” sections and “Next scripts continue to work”.
- Keep Workers Builds table (`cf:build` / `cf:deploy` / `cf:preview`).
- Keep secrets note for `FINNHUB_API_KEY` and `NEXT_PUBLIC_SITE_URL`.
- In `AGENTS.md`, fix the stale pointer: CEDEAR JSON fetch lives in `lib/get-cedears.ts`, not `lib/cedears.ts`.
- Keep the note that `pnpm lint` fails without eslint (shipped state).
- Do not edit `DESIGN.md`.

## Data structures

None.

## Verification

**Static.** Grep docs for `next dev`, `Next.js (default)`, `alongside the existing Next.js`. Expect zero hits that claim Next is still a workflow.

**Runtime.** n/a (prose only). Spot-read Getting started once.

## Implementer

Composer 2.5-fast. Apply **unslop** to both markdown files. Commit: `docs: document vinext-only workflow`.
