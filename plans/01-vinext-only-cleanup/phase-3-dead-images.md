# Phase 3. Dead image config

Back: [overview.md](./overview.md)

## Goal

Remove Cloudflare Images / `imagesOptimizer` wiring that never runs because the app uses `<img>` + `/api/logo`, not `next/image`.

## Changes

**Files:** `vite.config.ts`, `wrangler.jsonc`, `next.config.mjs`

1. `vite.config.ts` — drop `imagesOptimizer` import and the `images: { optimizer: … }` option. Keep `kvDataAdapter` / `cdnAdapter` cache config.
2. `wrangler.jsonc` — remove the `"images": { "binding": "IMAGES" }` block.
3. `next.config.mjs` — remove `images: { unoptimized: true }`. Keep `typescript.ignoreBuildErrors` and `serverExternalPackages: ['yahoo-finance2']`. Keep empty `turbopack: {}` only if vinext still expects it; otherwise delete that key too if unused.

Do not touch `lib/logo.ts` or `/api/logo`.

## Data structures

None. Logo URLs stay `/api/logo/:ticker`.

## Verification

**Static.** `pnpm run cf:build` exits 0.

**Runtime.** After `pnpm start`, `GET /api/logo/AAPL` returns 200 with an image content-type. Home page logos still load.

## Implementer

Composer 2.5-fast. Commit: `chore: remove unused Cloudflare Images optimizer config`.
