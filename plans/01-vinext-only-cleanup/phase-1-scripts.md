# Phase 1. Scripts only

Back: [overview.md](./overview.md)

## Goal

Make vinext the only npm workflow. No doc edits in this phase.

## Changes

**File:** `package.json`

- Set `dev` to `vinext dev --port 3000`.
- Set `build` to `vinext build`.
- Set `start` to `wrangler dev --config dist/server/wrangler.json`.
- Set `deploy` to the current `deploy:vinext` command (keep `NEXT_PUBLIC_SITE_URL=https://cedears.com`).
- Delete `dev:vinext`, `build:vinext`, `start:vinext`, `deploy:vinext` (or leave them as one-line aliases to the new names for one release; prefer delete to avoid dual docs).
- Keep `cf:build`, `cf:deploy`, `cf:preview` unchanged (Workers Builds CI).
- Keep `lint` as-is (known broken).
- Do **not** remove `next`, `webpack`, or `react-server-dom-webpack` here.

## Data structures

None.

## Verification

**Static.** `pnpm run build` exits 0 (vinext build).

**Runtime.** `pnpm run start` serves after build. `curl -s -o /dev/null -w '%{http_code}' http://localhost:8787/` (or whatever port wrangler prints) returns 200 for `/`.

## Implementer

Composer 2.5-fast. One file. Commit message: `chore: make vinext the default npm scripts`.
