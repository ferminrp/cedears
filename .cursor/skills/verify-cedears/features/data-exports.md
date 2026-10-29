# Data exports and feeds

Machine-readable CEDEAR data is exposed for agents and spreadsheets without using the interactive table.

## Sub-features

- `export-csv` — `/cedears.csv` downloadable dataset.
- `export-md` — `/cedears.md` markdown table.
- `export-json` — `/cedears.json` base metadata array.
- `sitemap` — `/sitemap.xml` lists canonical URLs with per-entry `<lastmod>` (data feed, git mtime, or route helpers in `lib/sitemap-lastmod`).

## How to get to it (user POV)

- Browser or `curl` directly to `/cedears.csv`, `/cedears.md`, `/cedears.json`, `/sitemap.xml`.
- From home, use table export actions for a filtered Markdown/CSV subset (see [home-list.md](./home-list.md)).

## Driving it with Playwright

Preconditions:

- `VERIFY_BASE_URL` is set; no browser required for HTTP-only checks.

- **CSV.** `curl -sfI "$VERIFY_BASE_URL/cedears.csv"` → 200, `content-type` contains `text/csv`. Body starts with a header row containing `Cedears` or equivalent column from the sheet.
- **Markdown.** `GET /cedears.md` → 200, body contains markdown table pipes `|`.
- **JSON.** `GET /cedears.json` → 200, parse as array length ≥ 1 when GitHub source is up.
- **Sitemap.** `GET /sitemap.xml` → 200, XML contains `<url>` entries and `<lastmod>` on indexable routes. `/portfolio` is not listed; `/ratios.csv` is not listed (CSV is linked from `/ratios` only).

The helper script `scripts/verify-cedears.mjs` records these in `smoke.json`.

## Gotchas

- When GitHub data is down, JSON may return 500 with `{ "error": "Error al cargar los datos" }`; treat as environment failure, not a passing export check.
- `NEXT_PUBLIC_SITE_URL` / wrangler `vars` set absolute `<loc>` values; production uses `https://cedears.com`. Canonical tags in HTML follow the same origin (see harness `canonical-smoke.json`).
