# Home list and search

The home page shows the top 100 CEDEARs by volume in the SSR table, an A–Z ticker index linking to every ficha, and a client-hydrated full list (from `/cedears.json`) after the user interacts with search or filters.

## Sub-features

- `home-top100` — static SSR table capped at 100 rows (highest volume), with caption pointing to categorías for the full universe.
- `home-az-index` — **Índice A–Z de CEDEARs** section with per-letter links to `/cedear/[ticker]`.
- `home-load` — table and index render when upstream data succeeds.
- `home-search` — text filter narrows visible tickers (loads `/cedears.json` on first interaction if not already loaded).
- `home-filters` — market and category comboboxes constrain the list (same lazy JSON load).
- `home-export` — Markdown and CSV export actions for the displayed rows once data is loaded.

## How to get to it (user POV)

- Open `/` (nav label **Listado**).
- H1 reads **Listado de CEDEARs en Argentina: precios, ratios y cotización hoy** (substring `Listado de CEDEARs en Argentina` is enough for checks).
- Use the search field labeled **Buscar CEDEARs**.
- Use **Filtrar por mercado**, **Filtrar por categoría**, and **Ordenar por variación** above the table.
- Scroll to **Índice A–Z de CEDEARs** for compact links to all tickers.
- Use export controls in the table toolbar (Markdown / CSV) after the interactive table has data.

## Driving it with Playwright

Preconditions:

- `VERIFY_BASE_URL` serves `/` with HTTP 200.
- Home HTML does **not** contain `Error al cargar los datos`.
- `node scripts/verify-cedears.mjs --base-url "$VERIFY_BASE_URL"` doctor passes.

- **Load table.** `page.goto(VERIFY_BASE_URL)`. `expect(page.getByRole('heading', { level: 1 })).toContainText('Listado de CEDEARs en Argentina')`. Table body shows at least one `link` matching `/Ver detalle de/` (SSR top-100 block or static fallback).
- **A–Z index.** `getByRole('heading', { name: 'Índice A–Z de CEDEARs' })` is visible; at least one link whose `href` matches `/cedear/`.
- **Search.** Focus `getByRole('searchbox', { name: 'Buscar CEDEARs' })` (focus triggers JSON load). `fill('AAPL')`. Wait briefly; a row link `Ver detalle de AAPL` is visible (or the list is empty with a clear empty state).
- **Screenshot proof.** `page.screenshot({ path: 'home-search-desktop.png' })` after search. Harness also writes `home-1440.png` and `home-390.png` with horizontal-overflow checks at those widths.
- **Export menu.** Open the export control and trigger CSV download if exposed as a button/menu; confirm download filename `cedears.csv` or network response `text/csv` from `/cedears.csv` for full-dataset export (see [data-exports.md](./data-exports.md)).

## Gotchas

- Failed GitHub fetch shows a destructive alert instead of the table; search/filter features cannot run until data loads.
- Before first interaction, only the SSR top-100 table and A–Z index are guaranteed in HTML; full-list search depends on `/cedears.json` loading client-side.
- Prices may be `null` in JSON; the UI should still render rows without inventing numbers.
- Sorting and filters are client-side; always assert on visible row text, not network order.
