# Plan: página `/alycs`

Comparador utilitario de ALyCs/brokers donde se pueden operar CEDEARs (personas físicas).

## Objetivo

Nueva ruta `/alycs` con nombre, logo (favicon Google) y costo de operar CEDEARs. Datos estáticos iniciales; copy es-AR; shell Stone Utility (`max-w-5xl`, Geist, shadcn).

## Arquitectura

```
lib/alycs.ts              → datos tipados + helpers (favicon, sort)
components/alyc-logo.tsx  → img favicon con fallback a inicial
components/alycs-list.tsx → lista scaneable (logo + comisión + niveles)
app/alycs/page.tsx        → metadata + shell (nav/h1/lead/list/footer)
site-nav / sitemap / llms → wiring
```

Sin fetch remoto: la data vive en el repo. Revalidate no hace falta (estático).

## Modelo de datos (`lib/alycs.ts`)

Discriminar comisiones y niveles de forma clara (sin optional-bag genérico):

```ts
type AlycCommission =
  | { kind: "exact"; percent: number }
  | { kind: "upTo"; percent: number }

type AlycTier = {
  name: string
  commission: AlycCommission
  condition: string // cuándo aplica, es-AR
}

type Alyc = {
  id: string
  name: string
  domain: string
  tarifarioUrl: string
  /** Comisión headline para persona física (web/app / digital / internet) */
  standardCommission: AlycCommission
  /** Derecho de mercado publicado, si se conoce */
  marketRightsPercent: number | null
  /** Niveles / bonificaciones (solo persona física) */
  tiers: AlycTier[]
  /** Notas cortas (mínimos, fecha del PDF, etc.) */
  notes: string[]
}
```

Helpers:
- `alycFaviconUrl(domain)` → `https://s2.googleusercontent.com/s2/favicons?domain=${domain}&sz=128`
- `getAlycs()` → array ordenado por comisión headline ascendente (`upTo` y `exact` usan el mismo número para sort; en empate, por nombre)
- `formatCommissionPercent(c)` → `0,50%` / `Hasta 0,50%` con `es-AR`

### Data inicial (persona física)

| id | name | domain | standard | marketRights | tiers / notes |
|----|------|--------|----------|--------------|---------------|
| iol | IOL invertironline | invertironline.com | exact 0.50 | 0.05 | Gold 0.50; $7,5M–$50M → 0.30; >$50M → 0.10 |
| balanz | Balanz | balanz.com | upTo 0.50 | null | Bonifica 50% intradiario |
| cocos | Cocos Capital | cocos.capital | exact 0.45 | null | Web/app PH 0.45; Gold/Pro publican 0% (sin costo del plan) |
| bull-market | Bull Market Brokers | bullmarketbrokers.com | exact 0.50 | 0.08 | Digital 0.50; Active Trader 0.25; Active Trader Plus 0.10; PDF mar 2025 |
| ppi | Portfolio Personal Inversiones — PPI | portfoliopersonal.com | exact 0.60 | null | Internet 0.60; asistida hasta 1.50 |
| eco-valores | Eco Valores | ecovalores.com.ar | exact 0.33 | 0.05 | No asesoradas 0.33; Club Millones 0.25; club+intradiario desde 0.13 |
| rava | Rava Bursátil | rava.com | upTo 0.80 | 0.08 | Renta variable contado; trading diario cobra el mayor de los dos lados |
| allaria | Allaria | allaria.com.ar | upTo 0.50 | null | Autogestionada (agrupa “acciones”); posibles bonif. volumen |
| sbs | SBS Trading | gruposbs.com | exact 0.70 | null | Quicktrade directos 0.70 mín $50; atención personalizada hasta 1% |
| puente | Puente | puentenet.com | upTo 0.50 | 0.06 | Internet “acciones”; mín USD 10 + IVA; +0.0351% derechos Bolsa; doc fechado 01/2024 |

URLs de tarifario: las del brief del usuario.

## UI

Seguir `DESIGN.md` — utilidad, no landing.

1. **Shell** idéntico a `/herramientas` / `/categorias`: `SiteNav` → `h1` → lead → contenido → `SiteFooter`.
2. **Callout** (`Alert variant="callout"`): todas las comisiones son **+ IVA**; todas cobran **derechos de mercado** (además de la comisión del broker). Scope: personas físicas.
3. **Lista** (`divide-y` / borde, no card grid marketing):
   - Fila: logo 32px (`rounded-md bg-muted`) | nombre | comisión headline `font-mono tabular-nums` alineada a la derecha.
   - Debajo del nombre (o bloque expandido siempre visible si hay `tiers.length > 0`): lista compacta de niveles con nombre + % + condición en `text-muted-foreground text-sm`.
   - Link “Ver tarifario” externo (`target=_blank` `rel=noopener noreferrer`) — outline/ghost compacto o texto underline como footer links.
   - `notes` como captions cortos bajo la fila.
4. **Logo**: componente client `AlycLogo` espejo de `TickerLogo` (onError → inicial del nombre).
5. **Metadata**: title/description/canonical/OG vía `buildPageOpenGraph`. Keywords naturales (ALyC, comisiones CEDEARs, brokers).
6. **Nav**: agregar `{ href: "/alycs", label: "ALyCs" }` en `site-nav.tsx` (después de Herramientas o cerca de Listado — preferir después de Herramientas).
7. **sitemap.ts** + **llms.txt**: incluir `/alycs`.

## Copy (es-AR)

- H1: `ALyCs para operar CEDEARs`
- Lead: `Comisiones publicadas para personas físicas. Compará brokers y abrí el tarifario oficial de cada uno.`
- Footer: disclaimer breve — tarifas pueden cambiar; siempre verificar el tarifario oficial.

## Fuera de alcance

- No afiliados / deep links de apertura de cuenta.
- No personas jurídicas (salvo nota puntual Cocos si ayuda a no confundir; preferir omitir o una sola línea en notes).
- No ESLint nuevo, no tests automatizados salvo que el repo ya los tenga para páginas similares.
- No proxy de favicons (Google s2 directo está OK para v1).

## Orden de implementación

1. `lib/alycs.ts` con data completa + helpers.
2. `AlycLogo` + `AlycsList`.
3. `app/alycs/page.tsx`.
4. Nav, sitemap, llms.txt.
5. Smoke: `pnpm build` o `pnpm dev` + visita `/alycs`.
