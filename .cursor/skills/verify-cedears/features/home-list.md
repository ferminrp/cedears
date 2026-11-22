# Home list and search

The home page shows the top 100 CEDEARs by volume in the SSR table, an A–Z ticker index linking to every ficha, and a client-hydrated full list after the user interacts with search or filters. Interactive loads use **`GET /api/cedears-live`** (quoted CEDEARs via `getCedears()`, not the public `/cedears.json` export). On viewports below `md`, the same table renders as **two-line list rows** (CSS `.ch-table` / `.ch-list`); category theme tables share the pattern.

## Sub-features

- `home-top100` — static SSR table capped at 100 rows (highest volume), with caption pointing to categorías for the full universe.
- `home-az-index` — **Índice A–Z de CEDEARs** section with per-letter links to `/cedear/[ticker]`.
- `home-load` — table and index render when upstream data succeeds.
- `home-live-json` — first search/filter focus triggers `fetch('/api/cedears-live')`; hides the static SSR block when the array is non-empty (`components/cedears-home-interactive.tsx`).
- `home-search` — text filter narrows visible tickers; shows **vistos hace poco** chips when the searchbox is focused and empty (`lib/recent-cedears.ts`, localStorage).
- `home-filters` — on mobile, market/category/sort appear as horizontal scroll chips; on desktop, comboboxes (**Filtrar por mercado**, **Filtrar por categoría**, **Ordenar por variación**).
- `home-export` — Markdown and CSV export actions for the displayed rows once data is loaded.
- `home-mobile-rows` — sub-`md`, each row is tappable end-to-end (link wraps logo, ticker, price, daily change).

## How to get to it (user POV)

- Open `/` (mobile tab **Listado** or desktop nav **Listado**).
- H1 reads **Listado de CEDEARs en Argentina: precios, ratios y cotización hoy** (substring `Listado de CEDEARs en Argentina` is enough for checks).
- Use the search field labeled **Buscar CEDEARs**.
- Use market/category/sort controls above the table.
- Scroll to **Índice A–Z de CEDEARs** for compact links to all tickers.
- Use export controls in the table toolbar (Markdown / CSV) after the interactive table has data.

## Driving it with Playwright

Preconditions:

- `VERIFY_BASE_URL` serves `/` with HTTP 200.
- Home HTML does **not** contain `Error al cargar los datos`.
- Doctor checks `GET /api/cedears-live` → 200 and non-empty JSON when GitHub data is reachable.

- **Load table.** `page.goto(VERIFY_BASE_URL)`. `expect(page.getByRole('heading', { level: 1 })).toContainText('Listado de CEDEARs en Argentina')`. Table body shows at least one `link` matching `/Ver detalle de /` (SSR top-100 block or static fallback).
- **A–Z index.** `getByRole('heading', { name: 'Índice A–Z de CEDEARs' })` is visible; at least one link whose `href` matches `/cedear/`.
- **Search.** Focus `getByRole('searchbox', { name: 'Buscar CEDEARs' })` (triggers live JSON load). After focus, expect a visible focus ring on desktop; `fill('AAPL')`. Wait for network idle or row update; a row link `Ver detalle de AAPL` is visible with **numeric** price cells (not `$ NaN`).
- **Screenshot proof.** `page.screenshot({ path: 'home-search-desktop.png' })` after search. Harness also writes `home-1440.png` and `home-390.png` with horizontal-overflow checks at those widths.
- **Export menu.** Open the export control and trigger CSV download; confirm `/cedears.csv` still serves the public export (see [data-exports.md](./data-exports.md)).

## Gotchas

- Failed GitHub fetch shows a destructive alert instead of the table; search/filter features cannot run until data loads.
- Before first interaction, only the SSR top-100 table and A–Z index are guaranteed in HTML; full-list search depends on `/api/cedears-live`.
- Public `/cedears.json` remains export-shaped (no live quotes); do not point interactive tests at that URL.
- Prices may still be `null` for illiquid names; UI must not render `$ NaN`.
- Sorting and filters are client-side; assert on visible row text, not network order.
- On mobile, pinning from the list UI is not exposed; pinned tickers still sort first when set elsewhere.