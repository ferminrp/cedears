# CEDEAR detail

Each CEDEAR has a detail page with breadcrumb navigation, SEO title and JSON-LD (WebPage, BreadcrumbList, FAQ), ARS/US/MEP/CCL pricing sections, historical chart, company profile, similar CEDEARs in the same category, news, and FAQs.

## Sub-features

- `detail-route` — `/cedear/[ticker]` returns 200 for a known ticker; unknown tickers 404.
- `detail-breadcrumb` — visible trail Listado → [categoría] → ticker (`nav` `aria-label="Breadcrumb"`).
- `detail-seo` — document `<title>` from `buildCedearDetailTitle`; `rel=canonical` to production `/cedear/{ticker}`.
- `detail-sections` — price sections and chart render for a liquid ticker.
- `detail-similares` — **CEDEARs similares** block when the ticker has a primary category tag.
- `detail-nav` — user can return to the list via breadcrumb or footer link.

## How to get to it (user POV)

- From home, choose **Ver detalle de {TICKER}** on a row or pick a ticker in **Índice A–Z de CEDEARs**.
- Or navigate directly to `/cedear/AAPL` (replace with any ticker from `/cedears.json`).

## Driving it with Playwright

Preconditions:

- `GET /cedears.json` returns at least one object with `Cedears` field; call that `SAMPLE_TICKER`.
- Data load succeeded on home (no global error alert).

- **Open detail.** `page.goto(\`${VERIFY_BASE_URL}/cedear/${SAMPLE_TICKER}\`)`. Status 200; H1 shows the company label (`cedearCompanyLabel`), with ticker in monospace below.
- **Breadcrumb.** `getByRole('navigation', { name: 'Breadcrumb' })` contains a link **Listado** to `/`.
- **Sections.** Section headings include **Precio histórico** and **Cotización y datos**; chart has `role="img"` with label containing the ticker.
- **Similares (optional).** When the sample ticker has a category tag, `getByRole('heading', { name: 'CEDEARs similares' })` is visible.
- **Proof.** Screenshot `cedear-detail-desktop.png`. Optional mobile screenshot at 390px width. Harness `canonical-smoke.json` includes this ticker’s canonical URL.

## Gotchas

- Unknown tickers should 404 (`notFound`); use a ticker from `/cedears.json`, not a random string.
- **CEDEARs similares** is omitted when there is no primary category tag on the CEDEAR.
- News and profile blocks may be empty when upstream APIs fail; do not fail the run unless the page errors entirely.
- Logo images load from `/api/logo/[ticker]`; a broken image is a regression but may be intermittent.
