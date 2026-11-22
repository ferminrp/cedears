# CEDEAR detail

Each CEDEAR has a detail page with breadcrumb navigation, SEO title and JSON-LD (WebPage, BreadcrumbList, FAQ), ARS/US/MEP/CCL pricing sections, historical chart, company profile, optional underlying dividend summary with link to `/dividendos`, similar CEDEARs in the same category, news, and FAQs. On viewports below `md`, content order is adjusted with CSS (`order`): price and daily change appear high on screen, company description collapses with **Ver más**, and a fixed **Agregar al portfolio** bar sits above the bottom tab bar.

## Sub-features

- `detail-route` — `/cedear/[ticker]` returns 200 for a known ticker; unknown tickers 404.
- `detail-breadcrumb` — visible trail Listado → [categoría] → ticker (`nav` `aria-label="Breadcrumb"`).
- `detail-seo` — document `<title>` from `buildCedearDetailTitle(cedear, paysDividends)`; `rel=canonical` to production `/cedear/{ticker}`.
- `detail-dividendos` — sección **Dividendos del subyacente** cuando Yahoo reporta pagos; enlace **Ver próximos dividendos** a `/dividendos`.
- `detail-sections` — price sections and chart render for a liquid ticker.
- `detail-similares` — **CEDEARs similares** block when the ticker has a primary category tag.
- `detail-nav` — user can return to the list via breadcrumb, mobile **Listado** tab, or footer link.
- `detail-mobile-action-bar` — `< md`: fixed bar with link **Agregar al portfolio** → `/portfolio?agregar={ticker}` (`components/cedear-detail-action-bar.tsx`); records ticker in **vistos hace poco**.

## How to get to it (user POV)

- From home, choose **Ver detalle de {TICKER}** on a row or pick a ticker in **Índice A–Z de CEDEARs** (mobile: tap the list row).
- Or navigate directly to `/cedear/AAPL` (replace with any ticker from `/cedears.json` or live API).
- On mobile, use **Agregar al portfolio** to jump into the portfolio sheet for that ticker.

## Driving it with Playwright

Preconditions:

- `GET /cedears.json` (or doctor sample ticker) yields at least one `Cedears` field: `SAMPLE_TICKER`.
- Data load succeeded on home (no global error alert).

- **Open detail.** `page.goto(\`${VERIFY_BASE_URL}/cedear/${SAMPLE_TICKER}\`)`. Status 200; H1 shows the company label, with ticker in monospace below.
- **Breadcrumb.** `getByRole('navigation', { name: 'Breadcrumb' })` contains a link **Listado** to `/`.
- **Sections.** Section headings include **Precio histórico** and **Cotización y datos**; chart has `role="img"` with label containing the ticker.
- **Mobile action bar (390px).** `getByRole('link', { name: 'Agregar al portfolio' })` visible; clicking it navigates to `/portfolio` with `agregar=` query matching the ticker.
- **Similares (optional).** When the sample ticker has a category tag, `getByRole('heading', { name: 'CEDEARs similares' })` is visible.
- **Proof.** Screenshot `cedear-detail-desktop.png`. Harness `canonical-smoke.json` includes this ticker’s canonical URL.

## Gotchas

- Unknown tickers should 404 (`notFound`); use a ticker from live data, not a random string.
- **CEDEARs similares** is omitted when there is no primary category tag on the CEDEAR.
- Mobile visual reorder uses CSS `order`; screen-reader reading order follows the HTML sequence.
- News and profile blocks may be empty when upstream APIs fail; do not fail the run unless the page errors entirely.
- Logo images load from `/api/logo/[ticker]`; a broken image is a regression but may be intermittent.