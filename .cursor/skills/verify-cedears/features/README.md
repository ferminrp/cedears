# CEDEARs verification map

Agent-facing index for user-visible behavior on [cedears.com](https://cedears.com) (local dev on vinext). Read this before driving the app, then open the feature file for the journey you need.

## Baseline preconditions

- Dependencies installed (`pnpm install`).
- App reachable at `VERIFY_BASE_URL` (default helper launch: `http://127.0.0.1:3010`).
- Outbound HTTPS to GitHub for `lib/get-cedears.ts`; without it the home table shows **Error al cargar los datos** and list features cannot pass.
- Run `node scripts/verify-cedears.mjs` doctor/smoke or the manual doctor steps in [SKILL.md](../SKILL.md) before deep UI work.
- Do not drive a shared `pnpm dev` on port 3000 unless the operator set `VERIFY_BASE_URL` explicitly.

## Driving conventions

- Start from a healthy baseline unless a feature file says otherwise.
- Prefer ARIA roles and accessible names from the Untitled UI components.
- Use Playwright against Chromium (`pnpm exec playwright install chromium` once per environment).
- HTTP-only checks are enough for export routes and sitemap; use the browser for search, nav, and tools.
- Keep proof artifacts outside `.verify-artifacts/` if you need them after cleanup (copy to `/opt/cursor/artifacts/`).

## Proof and skip reporting

- Capture the user action and the resulting UI state, not only the landing screen.
- Record which feature ID and entry point you used in artifact names or `summary.json`.
- If an entry point is unreachable (data load failure, missing ticker), report the attempted step and failed precondition; do not mark the feature verified via a different path.

## Feature entry contract

Each feature file uses H1, one intro paragraph, then these H2 sections in order: `Sub-features`, `How to get to it (user POV)`, `Driving it with Playwright`, `Gotchas`.

## Features

- [Home list and search](./home-list.md) — main CEDEAR table, filters, export buttons.
- [CEDEAR detail](./cedear-detail.md) — per-ticker page, chart, FAQs.
- [Data exports and feeds](./data-exports.md) — CSV, Markdown, JSON, sitemap.
- [Portfolio](./portfolio.md) — local portfolio tracking view.
- [Tools (DCA and rebalance)](./herramientas.md) — calculators under Herramientas.
