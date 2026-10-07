---
version: alpha
name: CEDEARs Argentina
description: Sistema visual del listado y herramientas de CEDEARs — tema Untitled (Graphical), Timeless Grotesk (referencia; el usuario aporta los archivos), neutros cool y acento #fc032d.
colors:
  primary: "#000000"
  on-primary: "#fbfbfc"
  secondary: "#f3f4f6"
  on-secondary: "#000000"
  tertiary: "#787e84"
  on-tertiary: "#fbfbfc"
  neutral: "#f3f4f6"
  background: "#ffffff"
  on-background: "#000000"
  surface: "#fbfbfc"
  on-surface: "#000000"
  surface-muted: "#f3f4f6"
  on-surface-muted: "#787e84"
  callout: "#f3f4f6"
  on-callout: "#000000"
  border: "#e5e7eb"
  input: "#e5e7eb"
  ring: "#fc032d"
  destructive: "#fc032d"
  on-destructive: "#ffffff"
  positive: "#00906c"
  negative: "#fc032d"
  accent: "#fc032d"
  dark-background: "#000000"
  dark-on-background: "#ffffff"
  dark-surface: "#1c2026"
  dark-on-surface: "#ffffff"
  dark-callout: "#272b31"
  dark-on-callout: "#ffffff"
  dark-border: "#393e43"
  dark-positive: "#00906c"
  dark-negative: "#fc032d"
typography:
  headline-lg:
    fontFamily: "Timeless Grotesk"
    fontSize: 42px
    fontWeight: 600
    lineHeight: 46px
    letterSpacing: 0
  headline-md:
    fontFamily: "Timeless Grotesk"
    fontSize: 32px
    fontWeight: 600
    lineHeight: 35px
    letterSpacing: 0
  headline-sm:
    fontFamily: "Timeless Grotesk"
    fontSize: 21px
    fontWeight: 600
    lineHeight: 28px
    letterSpacing: 0
  title-md:
    fontFamily: "Timeless Grotesk"
    fontSize: 14px
    fontWeight: 500
    lineHeight: 21px
  body-md:
    fontFamily: "Timeless Grotesk"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 18px
  body-sm:
    fontFamily: "Timeless Grotesk"
    fontSize: 11px
    fontWeight: 400
    lineHeight: 14px
  label-md:
    fontFamily: "Timeless Grotesk"
    fontSize: 12px
    fontWeight: 500
    lineHeight: 18px
  label-sm:
    fontFamily: "Timeless Grotesk"
    fontSize: 11px
    fontWeight: 500
    lineHeight: 14px
  numeric:
    fontFamily: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace
    fontSize: 12px
    fontWeight: 400
    lineHeight: 18px
rounded:
  sm: 5px
  md: 9px
  lg: 13px
  xl: 22px
  full: 9999px
spacing:
  xs: 6px
  sm: 8px
  md: 11px
  lg: 17px
  xl: 22px
  "2xl": 34px
  gutter: 17px
  margin: 17px
  section: 34px
  content-max: 64rem
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.sm}"
    height: auto
    padding: 8px 17px
  button-primary-hover:
    backgroundColor: "{colors.primary}"
    shadow: "0px 2px 4px 0px #00000000"
  button-outline:
    backgroundColor: "{colors.background}"
    textColor: "{colors.on-background}"
    typography: "{typography.label-md}"
    rounded: "{rounded.lg}"
    height: 32px
    padding: 10px
  button-outline-hover:
    backgroundColor: "{colors.surface-muted}"
  button-ghost:
    backgroundColor: "{colors.background}"
    textColor: "{colors.on-background}"
    typography: "{typography.label-md}"
    rounded: "{rounded.lg}"
    height: 32px
  button-ghost-hover:
    backgroundColor: "{colors.surface-muted}"
  button-destructive:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.destructive}"
    typography: "{typography.label-md}"
    rounded: "{rounded.lg}"
    height: 32px
  nav-link:
    backgroundColor: "{colors.background}"
    textColor: "{colors.tertiary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    padding: 12px
  nav-link-active:
    backgroundColor: "{colors.on-background}"
    textColor: "{colors.neutral}"
  input-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    height: 32px
    padding: 10px
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-md}"
    rounded: "{rounded.xl}"
    padding: 16px
  card-tool:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.lg}"
    padding: 20px
  badge-default:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
    height: 20px
    padding: 8px
  badge-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.on-secondary}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
    height: 20px
    padding: 8px
  badge-outline:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
    height: 20px
    padding: 8px
  alert-destructive:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.destructive}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: 10px
  callout:
    backgroundColor: "{colors.callout}"
    textColor: "{colors.on-callout}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: 10px
  table-container:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
  table-header:
    backgroundColor: "{colors.surface-muted}"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-md}"
    height: 40px
  table-row-hover:
    backgroundColor: "{colors.secondary}"
  pct-positive:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.positive}"
    typography: "{typography.numeric}"
  pct-negative:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.negative}"
    typography: "{typography.numeric}"
  dark-shell:
    backgroundColor: "{colors.dark-background}"
    textColor: "{colors.dark-on-background}"
  dark-card:
    backgroundColor: "{colors.dark-surface}"
    textColor: "{colors.dark-on-surface}"
  dark-pct-positive:
    backgroundColor: "{colors.dark-surface}"
    textColor: "{colors.dark-positive}"
    typography: "{typography.numeric}"
  dark-pct-negative:
    backgroundColor: "{colors.dark-surface}"
    textColor: "{colors.dark-negative}"
    typography: "{typography.numeric}"
  icon-well:
    backgroundColor: "{colors.surface-muted}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.md}"
    size: 40px
---

## Overview

**CEDEARs Argentina** es una utilidad financiera clara y confiable: listados, precios, ratios y calculadoras para inversores argentinos. La personalidad es sobria, precisa y sin adornos — más terminal de datos que landing promocional.

El estilo es **Stone Utility**: shadcn `base-nova` sobre la base `stone`, tipografía Geist, controles compactos y mucho contraste tipográfico. La interfaz prioriza escanear tablas, filtrar y exportar; el color de marca no compite con los datos. Copy y UI en **español argentino (es-AR)**.

Implementación de referencia: variables CSS en `app/globals.css`, componentes en `components/ui/*`, layout de página en `app/*/page.tsx`.

## Colors

La paleta es casi monocromática: neutros stone cálidos y un primario casi negro. No hay accent cromático de marca; la interacción se resuelve con inversión (foreground sobre background) y estados muted.

- **Primary (#1c1917):** Piedra oscura para botones principales, badges default y texto de énfasis.
- **On-primary (#fafaf9):** Texto sobre primary.
- **Secondary / muted (#f5f5f4):** Fondos suaves de chips, hovers y superficies auxiliares.
- **Tertiary / muted-foreground (#79716b):** Metadatos, captions, nav inactiva y copy secundario.
- **Background (#f5f5f4):** Lienzo de página (alineado con `themeColor` light `#f5f4f1`).
- **On-background / foreground (#0c0a09):** Texto principal y nav activa (invertida).
- **Surface (#ffffff):** Cards, inputs, filas de tabla y paneles sobre el fondo.
- **Callout (#ebe9e6 / dark #3a3530):** Bloques informativos sobre el lienzo de página (respuestas directas, contexto SEO, avisos neutros). Más oscuro que el background en light, ligeramente más claro en dark — sin llegar a `bg-card`.
- **Border / input (#e7e5e4):** Contornos 1px (`border`, `input`); jerarquía sin sombras pesadas. Tokens de borde no van en `components.*` porque el schema no modela `borderColor` — se aplican vía clases Tailwind.
- **Ring (#a8a29e):** Focus visible (`ring-3` + `ring-ring/50`); no es color de texto.
- **Destructive (#e7000b):** Errores y alertas; en botones suele ir como tinte (`/10`) + texto destructive.
- **Positive / negative:** Variación % del mercado — emerald (`#059669` / dark `#34d399`) y red (`#dc2626` / dark `#f87171`). No usarlos como decoración de marca.

En código las tokens viven como `oklch(...)` en `:root` / `.dark` / `prefers-color-scheme`. Dark mode es ciudadano de primera: invertir superficies, suavizar bordes a blanco ~10% opacity, y mantener la misma jerarquía (tabla, card, muted). No introducir púrpuras, glows ni acentos “AI default”.

## Typography

Una sola familia: **Geist** (`next/font/google`, variable `--font-sans`). Sin serif display ni segunda familia de UI.

- **Headlines:** `font-semibold tracking-tight`, `text-3xl` → `md:text-4xl` en H1 de página; secciones en `text-lg` / `text-base`.
- **Body:** `text-sm` como default de lectura; `text-muted-foreground` para apoyo; `text-pretty` / `text-balance` en títulos y párrafos largos.
- **Labels:** `text-sm font-medium` en botones, nav y headers de tabla.
- **Números:** `font-mono tabular-nums` (y a menudo `text-right`) para precios, %, ratios y montos. Formateo con `Intl.NumberFormat("es-AR")`.

Antialiasing en `body`. No mezclar pesos libres: preferí 400 / 500 / 600.

## Layout

Columna única centrada: `max-w-5xl` (64rem), `px-4`, `py-10 md:py-16`, `gap-8` entre bloques mayores. Cada página sigue el mismo esqueleto:

1. `SiteNav`
2. `h1` (+ opcional lead `text-muted-foreground`)
3. Contenido (tabla, tool, detalle)
4. `SiteFooter` con `mt-auto border-t`

Espaciado interno de herramientas y listados: `gap-3`–`gap-4` entre controles; grids de tools en `sm:grid-cols-2`. Toolbar de filtros: columna en mobile, fila en `sm+`. Contenedores de tabla: `overflow-hidden rounded-lg border`.

No armar dashboards multi-panel ni hero marketing en páginas de datos.

## Elevation & Depth

Profundidad por **tonos y anillos**, no por sombras decorativas.

- Página = background stone; contenido interactivo = `bg-card` blanco (o superficie dark).
- Callouts informativos = `bg-callout` (`Alert variant="callout"`): panel tenue entre el fondo y las cards; no usar `bg-muted` semitransparente sobre `bg-background` (en light son el mismo tono).
- Cards: `ring-1 ring-foreground/10` (ver `components/ui/card.tsx`).
- Menús / selects: `shadow-md` + el mismo ring — reserva sombra para overlays flotantes.
- Hover de filas y links de tools: `hover:bg-muted/50` o `hover:border-foreground/30`.
- Separadores: `border-t` / `border-b`, no drop shadows bajo secciones.

## Shapes

Radio base `--radius: 0.625rem` (10px), con escala Tailwind derivada (`rounded-sm` … `rounded-xl`).

- Controles (botón, input, select, alert): `rounded-lg`.
- Cards: `rounded-xl`.
- Nav links y icon wells: `rounded-md`.
- Badges: `rounded-4xl` / full pill.
- Evitar `rounded-full` en botones y cards; reservarlo a badges y avatares.

## Components

Stack: **shadcn/ui (base-nova) + Base UI + Lucide**. Preferí los primitives de `components/ui` antes de inventar controles nuevos.

- **Buttons:** Compactos (`h-8` default). Variantes `default` | `outline` | `secondary` | `ghost` | `destructive` | `link`. CTA principal = inversión piedra oscura, no color brand.
- **Nav:** Desktop = links `rounded-md`; activo = `bg-foreground text-background`. Mobile = `Sheet` izquierdo + trigger `outline` `sm`.
- **Inputs / selects:** Alto 32px, `bg-card`, borde `input`, focus ring. Search con icono Lucide absoluto a la izquierda (`pl-9`).
- **Tables:** Header `bg-muted`, filas `bg-card` + hover muted; números mono alineados a la derecha.
- **Cards / tool tiles:** Borde + `bg-card`; tiles de herramientas con icono en pozo `bg-muted` `rounded-md`.
- **Badges:** Altura fija `h-5`, pill, variantes default/secondary/outline/destructive.
- **Alerts:** `rounded-lg border`; destructive coloreada en texto, no en fondo saturado.
- **Callouts:** `Alert variant="callout"` para mensajes informativos sobre el fondo de página (p. ej. “Sí, existe CEDEAR de …”). Fondo `bg-callout`, borde `border-border/60`, icono `text-muted-foreground`, cuerpo `text-callout-foreground`. No mezclar con cards ni con alerts de error (`destructive`).
- **Empty states:** `Empty` centrado dentro de contenedor `rounded-lg border`.
- **Toasts:** Sonner (`Toaster` en layout).
- **Sheets:** Detalle de CEDEAR y menú mobile; side panels, no modales centricos para navegación.

## Do's and Don'ts

- Do reutilizar el shell `max-w-5xl` + nav + h1 + footer en páginas nuevas.
- Do mantener controles a altura ~32px y tipografía `text-sm` en UI densa.
- Do usar `font-mono tabular-nums` para cualquier cifra comparable.
- Do respetar light/dark vía tokens CSS existentes; no hardcodear hex sueltos salvo excepciones (p. ej. % positivo/negativo).
- Do copy en español argentino, tono directo y utilitario.
- Don't introducir una segunda familia tipográfica o un accent púrpura/índigo/terracotta de “AI default”.
- Don't llenar el primer viewport con stats strips, pills decorativas o heroes con imagen.
- Don't usar cards con sombra multi-capa ni glassmorphism; el ring sutil alcanza.
- Don't saturar de badges: uno o dos por fila de datos, no clusters.
- Don't romper shadcn: extendé variantes CVA en los UI primitives en lugar de CSS one-off.
