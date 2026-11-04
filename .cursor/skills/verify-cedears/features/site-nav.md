# Site navigation (Secciones)

The header exposes primary routes under `nav` **Secciones** (desktop bar and mobile sheet). Client navigations keep the current page visible until the next route commits; a thin progress indicator appears only when a transition takes longer than ~150ms.

## Sub-features

- `nav-links` — Listado, Portfolio, Categorías, Ratios, Herramientas, ALyCs, Dólar MEP, Dólar cable, Earnings, Dividendos (`components/site-nav.tsx`).
- `nav-touch-targets` — Desktop links use `min-h-11` (44px); mobile **Menú** trigger matches the same minimum height.
- `nav-prefetch` — Internal `Link` entries use `prefetch={true}`.
- `nav-pending-ui` — Active link uses `aria-current="page"`; clicked target gets `aria-busy` and optional **Cargando** sr-only via `useLinkStatus`.
- `nav-progress` — `NavigationProgress` listens for same-origin anchor clicks; after 150ms shows an accessible top bar (`role="progressbar"`, label **Cargando página**) until pathname commits or navigation idles.
- `nav-no-full-skeleton` — Layout no longer swaps the whole shell for `SiteLoading` on route change; previous page stays on screen during vinext transitions (`components/site-shell.tsx`).

## How to get to it (user POV)

- Every page shows the header. On narrow viewports, open **Menú** to reach the same links.
- Click any section link (e.g. **Ratios** → **Dividendos**) to exercise client navigation.

## Driving it with Playwright

Preconditions:

- `VERIFY_BASE_URL` serves the home table (no **Error al cargar los datos** on `/`).

- **Landmarks.** `getByRole('navigation', { name: 'Secciones' })` visible on desktop; mobile uses sheet trigger **Menú**.
- **Client nav.** From `/`, `getByRole('link', { name: 'Ratios' }).click()` then wait for URL `/ratios`. Content from the prior route should not flash a full-page skeleton; optional progress bar may appear on slow loads.
- **Touch layout.** Harness clips `nav-desktop-768.png` and `nav-mobile-390.png` and asserts no horizontal overflow at 768px and 390px.

## Gotchas

- Progress bar timing depends on network; do not require it on every click—only that navigation completes without a blank full-viewport loading shell.
- Back/forward (`popstate`) does not force scroll-to-top; forward client navigations do.
- Mobile sheet closes after choosing a link.
