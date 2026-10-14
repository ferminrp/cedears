# CEDEAR detail

Each CEDEAR has a detail page with ARS/US/MEP/CCL pricing sections, historical chart, company profile, news, and FAQs.

## Sub-features

- `detail-route` — `/cedear/[ticker]` returns 200 for a known ticker.
- `detail-sections` — price sections and chart render for a liquid ticker.
- `detail-nav` — user can return to the list via site chrome.

## How to get to it (user POV)

- From home, choose **Ver detalle de {TICKER}** on a row.
- Or navigate directly to `/cedear/AAPL` (replace with any ticker from `/cedears.json`).

## Driving it with Playwright

Preconditions:

- `GET /cedears.json` returns at least one object with `Cedears` field; call that `SAMPLE_TICKER`.
- Data load succeeded on home (no global error alert).

- **Open detail.** `page.goto(\`${VERIFY_BASE_URL}/cedear/${SAMPLE_TICKER}\`)`. Status 200; heading or title references the ticker or company name.
- **Sections.** `getByLabel` or section headings for ARS/MEP/CCL blocks (`aria-labelledby` sections in `cedear-detail-view`). Chart has `role="img"` with label containing the ticker.
- **Proof.** Screenshot `cedear-detail-desktop.png`. Optional mobile screenshot at 390px width.

## Gotchas

- Unknown tickers should 404 (`notFound`); use a ticker from `/cedears.json`, not a random string.
- News and profile blocks may be empty when upstream APIs fail; do not fail the run unless the page errors entirely.
- Logo images load from `/api/logo/[ticker]`; a broken image is a regression but may be intermittent.
