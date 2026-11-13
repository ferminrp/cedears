# 004 — Fade in the company profile when it replaces its skeleton

- **Status**: TODO
- **Commit**: 864a784
- **Severity**: LOW
- **Category**: Missed opportunities (preventing a jarring change)
- **Estimated scope**: 1 file (`components/cedear-company-profile.tsx`), 1 return statement

## Problem

Inside the CEDEAR detail sheet, the company profile is fetched client-side. While loading, a pulsing skeleton is shown; when the fetch resolves, the skeleton is replaced by the real profile in a single frame.

```tsx
/* components/cedear-company-profile.tsx:146-167 — current */
  if (loading) {
    return (
      <section aria-busy="true" aria-label="Cargando perfil de la empresa">
        <div className="space-y-3">
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          <div className="flex gap-2">
            <div className="h-6 w-24 animate-pulse rounded-full bg-muted" />
            <div className="h-6 w-32 animate-pulse rounded-full bg-muted" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-full animate-pulse rounded bg-muted" />
            <div className="h-3 w-full animate-pulse rounded bg-muted" />
            <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </section>
    )
  }

  if (!profile) return null

  return <CedearCompanyProfile profile={profile} compact={compact} />
```

`CedearCompanyProfileLoader` is used in exactly one place: `components/cedear-detail-sheet.tsx:61`. `CedearCompanyProfile` (line 76) is also rendered server-side on ticker pages and must not animate there.

Frequency: occasional (once per sheet open). Purpose: preventing a jarring change.

## Target

Only the loaded content fades in: opacity 0 → 1, no translate, no scale, on the small-motion tokens (`--motion-duration` = `200ms`, `--motion-easing` = `cubic-bezier(0.16, 1, 0.3, 1)`). The skeleton is not animated out.

```tsx
/* components/cedear-company-profile.tsx:167 — target */
  return (
    <div className="animate-in fade-in-0 duration-[var(--motion-duration)] ease-[var(--motion-easing)]">
      <CedearCompanyProfile profile={profile} compact={compact} />
    </div>
  )
```

`animate-in` and `fade-in-0` come from `tw-animate-css` (imported at `app/globals.css:2`, `^1.4.0` in `package.json`); its `enter` animation reads Tailwind's `duration-*` and `ease-*` utilities, so the two token classes set its timing.

Reduced motion: keep the fade. It is opacity-only, which is already the gentle variant.

This does not address any height difference between skeleton and content; that is a layout matter and out of scope.

## Repo conventions to follow

- Token usage: `duration-[var(--motion-duration)] ease-[var(--motion-easing)]`, exemplar `components/ui/input.tsx:12`.
- Small content changes use the small curve (`gui/foundations.md`, "Motion and focus").
- The wrapper is applied in the Loader (the client-only path), not inside `CedearCompanyProfile`, so server-rendered ticker pages are unaffected.

## Steps

1. In `components/cedear-company-profile.tsx`, replace the single line `return <CedearCompanyProfile profile={profile} compact={compact} />` (line 167, the last statement of `CedearCompanyProfileLoader`) with the wrapped return from Target.
2. Before relying on the classes, confirm they exist in the installed package: `grep -rn "fade-in\|animate-in" node_modules/tw-animate-css/dist/*.css | head` (the package's stylesheet lives under `dist/`; `ls node_modules/tw-animate-css/dist` if the glob finds nothing). If `animate-in` or `fade-in` is not defined there, STOP and report.

## Boundaries

- Do NOT edit `CedearCompanyProfile`, `ProfileContent`, the skeleton markup, or the fetch logic.
- Do NOT add a translate, scale, blur, stagger or an exit animation.
- Do NOT add dependencies or new motion values.
- If a step doesn't match the code you find (drift since the commit stamp), STOP and report instead of improvising.

## Verification

- **Mechanical**:
  - `pnpm install --frozen-lockfile` (first time only).
  - `pnpm test` → passes.
  - `pnpm build` → succeeds.
  - `pnpm verify` → passes (if it cannot run for network reasons, say so).
  - `pnpm lint` is broken by design (`AGENTS.md`); skip it.
- **Feel check**: `pnpm dev`, http://localhost:3000. The profile needs `/api/underlying-profile/<TICKER>` to answer (it uses `FINNHUB_API_KEY`); if it returns 404 locally the component renders nothing and there is nothing to see. In that case stub the route in Playwright with a delayed 200 JSON response, or say plainly that it could not be observed.
  - Throttle the network (DevTools → Network → Slow 4G) and click a table row: the skeleton pulses, then the "Sobre <TICKER>" block fades in over 200ms instead of popping.
  - On the wrapper `div`, `getComputedStyle(el).animationName` is `enter`, `animationDuration` is `0.2s`, `animationTimingFunction` is `cubic-bezier(0.16, 1, 0.3, 1)`.
  - At 10% playback there is no vertical movement, only opacity.
  - Open a ticker page (e.g. `/cedear/AAPL`): the server-rendered profile there does not animate.
  - Emulate `prefers-reduced-motion: reduce`: the fade still plays (opacity only).
- **Done when**: mechanical checks pass and the computed animation values above are confirmed on the wrapper (or the inability to observe is reported).
