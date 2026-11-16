# Dividendos

Calendario de CEDEARs que pagan dividendos en `/dividendos`, con yield, frecuencia, fechas ex-dividendo/pago, export CSV y bloque explicativo.

## Sub-features

- `dividendos-table` — tabla ordenable con datos Yahoo del subyacente (`getDividendsTableData`). Página ISR `revalidate = 86400` (sin `searchParams` en el server component).
- `dividendos-search` — `#dividendos-search` con label **Buscar CEDEAR** (componente `CedearTableSearch`, sticky en mobile).
- `dividendos-frequency` — filtros de frecuencia (ToggleGroup) leen `?frecuencia=` en el cliente (`DividendsTable` + `useSearchParams`). Middleware pone `X-Robots-Tag: noindex, follow` cuando `frecuencia` no está vacío (canonical sigue en `/dividendos` sin query).
- `dividendos-csv` — `/dividendos.csv` descargable; enlace en la página es `<a download>` (no `Link`) para no prefetch RSC del CSV. Si Yahoo falla por completo → HTTP 503 con `Cache-Control: no-store` (no se cachea el fallo en KV).
- `dividendos-load-failed` — estado vacío **No pudimos cargar los dividendos** cuando `loadFailed`; el loader no persiste fallos en caché (`lib/dividends-cache.ts` v2).
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
- **CSV.** `GET /dividendos.csv` → 200, `content-type` incluye `text/csv` cuando hay filas; en fallo total de carga → 503, `no-store`.
- **SEO filtro.** `GET /dividendos?frecuencia=mensual` → header `X-Robots-Tag: noindex, follow`; `GET /dividendos` sin query no lleva ese header (harness `assertDividendosFilteredRobots`).
- **Empty filter.** Buscar string improbable, assert **Sin resultados** y screenshot `dividendos-mobile-390-sin-resultados.png` en harness.

## Gotchas

- Falla parcial de Yahoo no debe tumbar la página entera; puede haber filas con yield/fechas en «—». Un fallo que deja cero filas y `loadFailed` no debe quedar cacheado 24 h tras recuperar Yahoo (#88).
- Frecuencia es solo client-side: el HTML cacheado de `/dividendos` es el mismo con o sin `?frecuencia=`; el filtro aplica después de hidratar.
- La metadata SEO de fichas CEDEAR usa `getUnderlyingPaysDividends` (ligero) para el `<title>`, no la tabla completa (#75).
- Artifacts del harness incluyen `dividendos-desktop-1440.png`, `dividendos-tablet-1024.png`, `dividendos-tablet-768.png`, `dividendos-mobile-390.png`, `dividendos-mobile-375.png`, y variantes con filtro/frecuencia.
