# Phase 5. Unused cache tag + local site URL

Back: [overview.md](./overview.md)

## Goal

Remove a cache tag that nothing invalidates. Make local metadata URLs match vinext on port 3000.

## Changes

**Files:** `lib/get-cedears.ts`, `lib/site.ts`

1. `lib/get-cedears.ts` — remove `CEDEAR_BASES_CACHE_TAG` export and the `tags: [...]` entry on the bases fetch. Keep `revalidate: 86400`.
2. `lib/site.ts` — keep fallback `http://localhost:3000` (matches phase 1 port). If it already says 3000, no change. Do not hardcode production URL here; `NEXT_PUBLIC_SITE_URL` / wrangler vars stay the prod source.

If a comment above the bases fetch mentions deploy invalidation via the tag, delete that comment too (no narrating leftovers).

## Data structures

`getCedearBases` fetch options become `{ next: { revalidate: 86400 } }` only. No tag type.

## Verification

**Static.** Repo-wide grep: zero hits for `CEDEAR_BASES_CACHE_TAG` and `cedear-bases`.

**Runtime.** `pnpm run cf:build`. Home and `/sitemap.xml` still resolve absolute URLs (prod URL when env set; localhost:3000 in bare local).

## Implementer

Composer 2.5-fast. Commit: `chore: drop unused cedear bases cache tag`.
