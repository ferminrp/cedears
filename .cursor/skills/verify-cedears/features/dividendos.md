# Dividendos

Calendario de CEDEARs que pagan dividendos en `/dividendos`, con yield, frecuencia, fechas ex-dividendo/pago, export CSV y bloque explicativo.

## Sub-features

- `dividendos-table` — tabla ordenable con datos Yahoo del subyacente (`getDividendsTableData`).
- `dividendos-search` — `#dividendos-search` con label **Buscar CEDEAR** (componente `CedearTableSearch`, sticky en mobile).
- `dividendos-frequency` — filtros de frecuencia (ToggleGroup); query `?frecuencia=` recibe `X-Robots-Tag: noindex, follow` vía middleware cuando hay filtro activo (canonical sigue en `/dividendos`).
- `dividendos-csv` — `/dividendos.csv` dataset descargable (smoke HTTP).
- `dividendos-layout` — sin overflow horizontal; encabezado de tabla sticky debajo del buscador en mobile (regresión cubierta en #75).

## How to get to it (user POV)

- Nav **Dividendos** → `/dividendos`.
- H1 **CEDEARs que pagan dividendos**; `<title>` incluye **yield y próximas fechas**.
- Desde una ficha CEDEAR, enlace **Ver próximos dividendos** cuando aplica el bloque de dividendos del subyacente.

## Driving it with Playwright

Preconditions:

- Smoke HTTP: `GET /dividendos` puede tardar varios minutos (timeout 600s en harness) mientras resuelve filas Yahoo.
- Playwright: esperar `input#dividendos-search` con timeout generoso antes de screenshots.

- **Load.** `page.goto(\`${VERIFY_BASE_URL}/dividendos\`)`. H1 **CEDEARs que pagan dividendos**.
- **Search.** `page.locator('#dividendos-search')` visible; sticky wrapper `#dividendos-search-sticky`.
- **Tabla.** `[data-dividendos-table-wrap]` sin scroll horizontal; thead alineado bajo el buscador al hacer scroll (harness `assertDividendosTableGeometry`).
- **Frecuencia.** `page.goto(\`${VERIFY_BASE_URL}/dividendos?frecuencia=mensual\`)` filtra filas; screenshot opcional `dividendos-mobile-390-frecuencia.png`.
- **CSV.** `GET /dividendos.csv` → 200, `content-type` incluye `text/csv`.
- **Empty filter.** Buscar string improbable, assert **Sin resultados** y screenshot `dividendos-mobile-390-sin-resultados.png` en harness.

## Gotchas

- Falla parcial de Yahoo no debe tumbar la página entera; puede haber filas con yield/fechas en «—».
- La metadata SEO de fichas CEDEAR usa `getUnderlyingPaysDividends` (ligero) para el `<title>`, no la tabla completa (#75).
- Artifacts del harness incluyen `dividendos-desktop-1440.png`, `dividendos-tablet-1024.png`, `dividendos-tablet-768.png`, `dividendos-mobile-390.png`, `dividendos-mobile-375.png`, y variantes con filtro/frecuencia.
