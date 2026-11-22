# Site navigation (Secciones)

The header exposes primary routes under `nav` **Secciones** on desktop (`md+`). Below `md`, a fixed **bottom tab bar** (`nav` **Secciones principales**) replaces the former hamburger + side sheet: Listado, Portfolio, Dólar, Calcular, and **Más** (bottom sheet with grouped links and optional **Instalar la app**). Client navigations keep the current page visible until the next route commits; a thin progress indicator appears only when a transition takes longer than ~150ms.

## Sub-features

- `nav-links-desktop` — Listado, Portfolio, Categorías, Ratios, Herramientas, ALyCs, Dólar MEP, Dólar cable, Earnings, Dividendos (`components/site-nav.tsx`, `hidden md:flex`).
- `nav-tab-bar-mobile` — Five tabs at the bottom: Listado (also active on `/cedear/*`), Portfolio, Dólar (`/dolar-mep` + `/dolar-cable`), Calcular (`/herramientas` + `/ratios`), **Más** button opening a bottom sheet (`aria-label="Secciones principales"`).
- `nav-mas-sheet` — Sheet title **Más**; nested `nav` **Más secciones** with grouped links (Explorar, Operar, Datos y app). **Instalar la app** row when the browser exposes an install path.
- `nav-bottom-offset` — `--bottom-nav-height` is `0px` on `md+`; on mobile it includes the tab bar and `safe-area-inset-bottom`. Main padding, Sonner toasts, detail **Agregar al portfolio** bar, and portfolio sheets stack above it.
- `nav-touch-targets` — Desktop links use `min-h-11` (44px). Mobile tabs use `min-h-12` (48px item height inside the bar).
- `nav-prefetch` — Internal `Link` entries in desktop **Secciones** and mobile tabs use `prefetch={true}`. Inline body links to `/ratios` also prefetch.
- `nav-csv-no-prefetch` — **Descargar CSV** on `/ratios` and `/dividendos` is a plain `<a download>` so the router does not RSC-prefetch `/ratios.csv` or `/dividendos.csv`.
- `nav-pending-ui` — Active link uses `aria-current="page"`; clicked target gets `aria-busy` and optional **Cargando** sr-only via `useLinkStatus`.
- `nav-progress` — `NavigationProgress` listens for same-origin anchor clicks; after 150ms shows an accessible top bar (`role="progressbar"`, label **Cargando página**) until pathname commits or navigation idles.
- `nav-no-full-skeleton` — Layout no longer swaps the whole shell for `SiteLoading` on route change; previous page stays on screen during vinext transitions (`components/site-shell.tsx`).
- `nav-www-apex` — `www.cedears.com` permanently redirects to `https://cedears.com` (path + query preserved) with `Cache-Control: no-store`. Production gateway runs `buildWwwToApexRedirect` in `worker/index.ts` before `CachedVinext`; helpers: `lib/www-redirect.ts`, `lib/request-host.ts`, `lib/workers-cache-key.ts`.
- `nav-pwa-sw` — Production registers `public/sw.js` (network-first HTML, offline banner, `/offline` fallback). Default dev harness does not assert SW lifecycle; use `pnpm test` (`tests/` for SW rules) or workers-mode manual checks.

## How to get to it (user POV)

- **Desktop:** use links under **Secciones** in the header.
- **Mobile:** use the bottom tabs; tap **Más** for Categorías, Ratios, Dividendos, ALyCs, MCP, etc.
- Click any section link to exercise client navigation (e.g. **Calcular** → `/herramientas`).

## Driving it with Playwright

Preconditions:

- `VERIFY_BASE_URL` serves the home table (no **Error al cargar los datos** on `/`).

- **Desktop landmarks.** Viewport ≥ 768px: `getByRole('navigation', { name: 'Secciones' })` visible.
- **Mobile landmarks.** Viewport 390×844: `getByRole('navigation', { name: 'Secciones principales' })` visible; `getByRole('button', { name: 'Más' })` opens dialog/sheet with heading **Más**.
- **Client nav.** From `/`, mobile `getByRole('link', { name: 'Calcular' }).click()` → URL under `/herramientas` or `/ratios` per tab routing. Desktop: `getByRole('link', { name: 'Ratios' }).click()` → `/ratios`. No full-page skeleton flash; optional progress bar on slow loads.
- **Touch layout.** Harness clips `nav-desktop-768.png` (header) and `nav-mobile-390.png` (bottom tab bar) and asserts no horizontal overflow at 768px and 390px.

## Gotchas

- Local `pnpm dev` rejects `Host: www.cedears.com` (403). Prove www behavior with `pnpm test` (`tests/www-apex-cache.test.ts`, `tests/worker-gateway.test.ts`) or production curls.
- Progress bar timing depends on network; do not require it on every click.
- **Más** sheet closes on navigation (including back/forward).
- Service worker and install prompts register only in production builds; `pnpm dev` will not show **Instalar la app** or offline cache behavior.
- Crawlers still receive the full desktop link list in SSR HTML (`nav` **Secciones**, visually hidden below `md`).