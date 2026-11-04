# Categorías (índice y listas temáticas)

El sitio agrupa CEDEARs por etiquetas en `/categorias` y en fichas `/categoria/{slug}` con tabla temática, intro SEO, FAQs y enlaces entre categorías hermanas.

## Sub-features

- `categorias-index` — `/categorias` lista todas las categorías con preview de tickers (`CategoryCompanyStack`).
- `categoria-listing` — `/categoria/{slug}` muestra H1 temático, migas, tabla `CedearsThemeTable`, bloque **Otras categorías**, y FAQs.
- `categoria-search` — buscador **Buscar en esta categoría** (`#category-theme-search`, sticky en mobile).
- `categoria-redirects` — slugs legacy (`/categoria/tech`, `/categoria/cripto`, `/categoria/farma-y-biotecnologia`) redirigen 301 al slug canónico (`tecnologia`, `cripto-y-bitcoin`, `salud`).
- `categoria-seo` — `rel=canonical` usa slug canónico (`/categoria/tecnologia`, no `/categoria/tech`).

## How to get to it (user POV)

- Nav **Categorías** → `/categorias` (H1 **Categorías de CEDEARs**).
- Elegí una fila del índice o un chip **Otras categorías** en otra ficha temática.
- URL directa de ejemplo: `/categoria/tecnologia` (canonical en `<head>`).

## Driving it with Playwright

Preconditions:

- `GET /cedears.json` o SSR de categoría responde sin alerta **Error al cargar los datos**.
- Doctor/smoke del harness incluye `/categorias` 200 y canonical de `/categoria/tecnologia`.

- **Índice.** `page.goto(\`${VERIFY_BASE_URL}/categorias\`)`. H1 **Categorías de CEDEARs**; al menos un `link` con `href` `/categoria/`.
- **Ficha temática.** `page.goto(\`${VERIFY_BASE_URL}/categoria/tecnologia\`)`. `getByRole('navigation', { name: 'Migas de pan' })` incluye **Inicio**, **Categorías**, y la categoría actual.
- **Tabla.** Esperar `#category-theme-search`. `getByRole('searchbox')` con label accesible **Buscar en esta categoría**. Tabla en `[data-category-theme-table]` con encabezados sticky bajo el buscador en viewports angostos (harness `assertCategoryThemeTableGeometry`).
- **Hermana.** `getByRole('heading', { name: 'Otras categorías' })` visible cuando hay slugs hermanos.
- **Redirect (HTTP).** `GET /categoria/tech` → 301/308 hacia URL que contiene `/categoria/tecnologia` (middleware `CATEGORY_SLUG_REDIRECTS`).
- **Desconocida.** `GET /categoria/no-existe-xyz` → **HTTP 404** con copy **Página no encontrada**, sin alerta de carga de datos (smoke del harness; no soft 200).

## Gotchas

- Slugs duplicados no deben indexarse: canonical y sitemap usan el slug resuelto (`canonicalCategorySlug`).
- La tabla temática reutiliza patrones de `/ratios` (sticky search height `--ratios-sticky-search-height` en mobile).
- Categoría vacía muestra empty state con enlace **Ver todas las categorías**.
- El harness captura `categoria-tecnologia-390.png`, `categoria-tecnologia-390-scrolled.png`, y variantes 1440px.
