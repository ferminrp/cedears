# Portfolio

The portfolio page lets users track nominal holdings locally (browser storage) with search and optional filters.

## Sub-features

- `portfolio-load` — `/portfolio` renders the portfolio shell.
- `portfolio-search` — search field filters displayed rows when holdings exist.

## How to get to it (user POV)

- Choose **Portfolio** in the main nav (`/portfolio`).
- Use **Buscar en cartera** when holdings are present.

## Driving it with Playwright

Preconditions:

- `GET /portfolio` → 200.
- No server-side seed data; holdings may be empty on a fresh profile.

- **Load page.** `page.goto(\`${VERIFY_BASE_URL}/portfolio\`)`. Nav shows **Portfolio** as current (`aria-current="page"` on the link).
- **Search control.** `getByRole('textbox', { name: 'Buscar en cartera' })` is visible when the portfolio UI is shown.
- **Proof.** Screenshot `portfolio-desktop.png`. If you add holdings manually in the UI, re-open the page and confirm tickers persist (localStorage).

## Gotchas

- Empty portfolio is valid; do not fail solely because no rows exist.
- Portfolio data is per-browser profile; automated runs start empty unless you import CSV through the UI first.
