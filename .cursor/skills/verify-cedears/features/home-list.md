# Home list and search

The home page lists all CEDEARs with live prices, lets users search and filter, sort by daily change, and export the visible set.

## Sub-features

- `home-load` — table renders with rows when upstream data succeeds.
- `home-search` — text filter narrows visible tickers.
- `home-filters` — market and category comboboxes constrain the list.
- `home-export` — Markdown and CSV export actions for the displayed rows.

## How to get to it (user POV)

- Open `/` (nav label **Listado**).
- Use the search field labeled **Buscar CEDEARs**.
- Use **Filtrar por mercado**, **Filtrar por categoría**, and **Ordenar por variación** above the table.
- Use export controls in the table toolbar (Markdown / CSV).

## Driving it with Playwright

Preconditions:

- `VERIFY_BASE_URL` serves `/` with HTTP 200.
- Home HTML does **not** contain `Error al cargar los datos`.
- `node scripts/verify-cedears.mjs --base-url "$VERIFY_BASE_URL"` doctor passes.

- **Load table.** `page.goto(VERIFY_BASE_URL)`. `expect(page.getByRole('heading', { level: 1 })).toContainText('Listado de CEDEARs en Argentina')`. Table body shows at least one `link` matching `/Ver detalle de/`.
- **Search.** `getByRole('searchbox', { name: 'Buscar CEDEARs' }).fill('AAPL')`. Wait briefly; a row link `Ver detalle de AAPL` is visible (or the list is empty with a clear empty state).
- **Screenshot proof.** `page.screenshot({ path: 'home-search-desktop.png' })` after search.
- **Export menu.** Open the export control and trigger CSV download if exposed as a button/menu; confirm download filename `cedears.csv` or network response `text/csv` from `/cedears.csv` for full-dataset export (see [data-exports.md](./data-exports.md)).

## Gotchas

- Failed GitHub fetch shows a destructive alert instead of the table; search/filter features cannot run until data loads.
- Prices may be `null` in JSON; the UI should still render rows without inventing numbers.
- Sorting and filters are client-side; always assert on visible row text, not network order.
