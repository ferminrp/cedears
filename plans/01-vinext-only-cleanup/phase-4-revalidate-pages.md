# Phase 4. Segment revalidate on live pages

Back: [overview.md](./overview.md)

## Goal

Pages that call `getCedears()` or `getEarningsTimeline()` get an explicit ISR TTL so Workers + KV behave like the rest of the site.

## Changes

**Files (batch A, one commit):** `app/portfolio/page.tsx`, `app/herramientas/dca/page.tsx`, `app/herramientas/rebalanceo/page.tsx`

- Add `export const revalidate = 300` (matches live quotes fetch TTL in `lib/get-cedears.ts`).

**Files (batch B, one commit):** `app/earnings/page.tsx`

- Add `export const revalidate = 21600` (matches `lib/earnings.ts` fetch TTL).

**Out of this phase**

- `app/herramientas/page.tsx` (static index, no fetch). Leave alone.
- Do not change existing revalidate values on `/`, dolar pages, or `/cedear/[ticker]`.
- Do not change `generateStaticParams`.

If three files in batch A is too wide for one Composer pass, split dca + rebalanceo first, then portfolio.

## Data structures

None. Segment config only.

## Verification

**Static.** Grep those four pages for `export const revalidate`.

**Runtime.** `pnpm run cf:build`. Smoke `/portfolio`, `/earnings`, `/herramientas/dca`, `/herramientas/rebalanceo` return 200 with content.

## Implementer

Composer 2.5-fast. Commits: `fix: add ISR revalidate to portfolio and tools pages`, then `fix: add ISR revalidate to earnings page`.
