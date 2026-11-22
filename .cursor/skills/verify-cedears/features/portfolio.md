# Portfolio

The portfolio page tracks nominal holdings in browser storage. **Desktop (`md+`)** keeps the searchable full CEDEAR table with per-row quantity inputs. **Mobile** shows a summary, inline allocation bar, and holdings list only; **Agregar CEDEAR** opens a bottom sheet (search → quantity stepper → Guardar / Quitar). Deep link **`/portfolio?agregar=TICKER`** opens add/edit for that ticker (from the detail **Agregar al portfolio** bar on mobile or row focus on desktop).

## Sub-features

- `portfolio-load` — `/portfolio` renders the portfolio shell (`PortfolioView`).
- `portfolio-search-desktop` — `searchbox` **Buscar en cartera** filters the desktop table when holdings exist.
- `portfolio-mobile-list` — sub-`md`, holdings render as rows with **Editar {ticker}** buttons; empty state CTA **Agregar CEDEAR** (`data-portfolio-add`).
- `portfolio-edit-sheet` — bottom sheet: pick step (**Agregar CEDEAR**, search **Buscar CEDEAR por ticker o nombre**) or quantity step (stepper, ARS/MEP preview, **Guardar**, **Quitar**). Deep link param `agregar` cleared from the URL after open (`replaceState`).
- `portfolio-deep-link` — `/portfolio?agregar=SPY` (example) opens the sheet on that ticker after hydration.

## How to get to it (user POV)

- Choose **Portfolio** in desktop **Secciones** or the mobile bottom tab.
- **Desktop:** use **Buscar en cartera** when holdings are present; edit quantities inline.
- **Mobile:** tap **Agregar CEDEAR** or a holding row to edit; or arrive from a ficha via **Agregar al portfolio**.

## Driving it with Playwright

Preconditions:

- `GET /portfolio` → 200.
- No server-side seed data; holdings start empty per browser profile.

- **Load page.** `page.goto(\`${VERIFY_BASE_URL}/portfolio\`)`. Active nav: desktop link **Portfolio** with `aria-current="page"`; mobile tab **Portfolio** highlighted in **Secciones principales**.
- **Desktop.** Viewport 1280×800: `getByRole('searchbox', { name: 'Buscar en cartera' })` visible once the table layout mounts.
- **Mobile.** Viewport 390×844: `getByRole('button', { name: 'Agregar CEDEAR' })` visible; bottom tab bar present. Optional: `goto(\`${VERIFY_BASE_URL}/portfolio?agregar=AAPL\`)` → sheet heading **Agregar CEDEAR** or ticker title with **Agregar** sr-only prefix.
- **Proof.** Screenshot `portfolio-desktop.png` at desktop width. If you add holdings via UI, re-open the page and confirm tickers persist (localStorage).

## Gotchas

- Empty portfolio is valid; do not fail solely because no rows exist.
- Portfolio data is per-browser profile; automated runs start empty unless you seed via the sheet or desktop inputs.
- Mobile never renders the full ~400-row table; do not expect per-ticker inputs for every CEDEAR on narrow viewports.
- Storage format is unchanged across the mobile redesign; existing profiles load after upgrade.