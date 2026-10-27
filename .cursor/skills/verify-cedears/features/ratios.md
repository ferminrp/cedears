# Ratios page

Tabla de ratios, calculadora CEDEARs ↔ acciones y export CSV en `/ratios`.

## Sub-features

- `ratios-table` — listado ordenable (ticker, empresa, ratio, precio ARS).
- `ratio-calculator` — conversión y precio teórico al CCL promedio.
- `ratios-csv` — descarga `/ratios.csv`.

## How to get to it (user POV)

- Nav **Ratios**, enlace en home (“Ver tabla de ratios y calculadora”), enlace en ficha CEDEAR, o URL directa `/ratios`.

## Driving it with Playwright

- `GET /ratios` → 200, H1 contiene `Ratios de conversión`.
- `GET /ratios.csv` → 200, `text/csv`, header `Ticker,Empresa,Ratio,Precio ARS`.
- Desktop 1440×900 y mobile 390×844 screenshots sin scroll horizontal en viewport.

## Gotchas

- CCL teórico depende de `summarizeImplicitDollar(..., "cable")`; sin datos cable, la calculadora ARS teórica muestra “—”.
- Fecha en H1 usa el máximo `yfinance-metadata.fetched_at` del JSON de google-sheets-argento, formateado en zona horaria Argentina.
- La tabla y el CSV excluyen CEDEARs sin precio ARS.
