# 005 — Reveal the "¿Cuánto querés invertir?" block instead of popping it in

- **Status**: TODO
- **Commit**: 864a784
- **Severity**: LOW
- **Category**: Missed opportunities (preventing a jarring change)
- **Estimated scope**: 1 file (`components/rebalance-calculator.tsx`), ~8 lines of wrapper markup

> Lowest-value plan in this set. If any step does not fit cleanly, stop and report; do not force it.

## Problem

In the rebalance calculator, choosing the "accumulate" mode radio mounts the contribution input block directly under the control just clicked, and the donut card below is shoved down in one frame. Choosing the other mode removes it just as abruptly.

```tsx
/* components/rebalance-calculator.tsx:458, 486-531 — current (abridged where marked) */
          <section className="flex flex-col gap-3">
            …radiogroup (lines 459-486)…

            {isAccumulate && (
              <div className="flex flex-col gap-2">
                <label htmlFor="rebalance-contribution" className="text-sm font-medium">
                  ¿Cuánto querés invertir?
                </label>
                …input and optional hint (lines 493-526)…
              </div>
            )}
          </section>

          <section className="grid gap-6 rounded-[var(--radius-m)] border border-border bg-card p-4 sm:grid-cols-2">
```

`isAccumulate` is `mode === "accumulate"` (line 303).

The repo already has a house pattern for an animated disclosure:

```tsx
/* components/portfolio-distribution.tsx:61-67 — exemplar */
          <div
            className={cn(
              "grid transition-[grid-template-rows] duration-200 ease-out",
              expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
            )}
          >
            <div className="overflow-hidden">
```

(That exemplar hardcodes `duration-200 ease-out`; do not copy those two classes and do not fix them here.)

Frequency: occasional. Purpose: preventing a jarring change.

## Target

The block is always rendered and collapses with `grid-template-rows`, on the theme's **large** tokens (disclosure role, `gui/foundations.md`): `--motion-large-duration` = `360ms`, `--motion-large-easing` = `cubic-bezier(0.22, 1, 0.36, 1)`. Height via `grid-template-rows` is the accepted exception to transform/opacity-only.

```tsx
/* components/rebalance-calculator.tsx:488-528 — target */
            <div
              className={cn(
                "grid transition-[grid-template-rows,margin-top,opacity] duration-[var(--motion-large-duration)] ease-[var(--motion-large-easing)] motion-reduce:transition-[opacity]",
                isAccumulate
                  ? "grid-rows-[1fr] opacity-100"
                  : "-mt-3 grid-rows-[0fr] opacity-0",
              )}
              inert={!isAccumulate}
            >
              <div className="-m-1 min-h-0 overflow-hidden p-1">
                <div className="flex flex-col gap-2">
                  <label htmlFor="rebalance-contribution" className="text-sm font-medium">
                    ¿Cuánto querés invertir?
                  </label>
                  …input and optional hint, unchanged, indented two more levels…
                </div>
              </div>
            </div>
```

Why each piece exists (keep all of them):

- `-mt-3` when collapsed cancels the parent section's `gap-3`, so the collapsed block adds 0px and the page is laid out exactly as it is today in the non-accumulate mode. `margin-top` is in the transition list so the gap opens together with the height.
- `-m-1 … p-1` on the clipping element gives the input's focus outline (2px wide, 2px offset, `components/ui/input.tsx:12`) 4px of room so `overflow-hidden` does not cut it; the negative margin cancels the padding so the layout is unchanged.
- `min-h-0` lets the grid row actually reach 0.
- `inert` removes the hidden input from the tab order and from assistive technology while collapsed (React 19 supports the boolean `inert` prop).
- `motion-reduce:transition-[opacity]`: with reduced motion the block appears at full height immediately and only fades.

End states must be pixel-identical to today: same position of the donut card in both modes.

## Repo conventions to follow

- `cn(…)` from `@/lib/utils` for conditional classes (already imported in this file; see line 474).
- Tokens as arbitrary values: `duration-[var(--motion-large-duration)] ease-[var(--motion-large-easing)]`, exemplar `components/ui/sheet.tsx:56`.
- Structure exemplar: `components/portfolio-distribution.tsx:61-67`.

## Steps

1. Before editing, record the baseline: run `pnpm dev`, open `/herramientas/rebalanceo` (`app/(site)/herramientas/rebalanceo/page.tsx`), add at least one holding so the mode radios show, and note `getBoundingClientRect().top` of the section containing "Composición actual" in both modes at 1280px and 390px widths.
2. In `components/rebalance-calculator.tsx`, replace `{isAccumulate && (` (line 488) and its matching `)}` (line 528) with the wrapper structure from Target, keeping lines 489–527 (the existing `<div className="flex flex-col gap-2">…</div>`) intact as the innermost child, re-indented.
3. Do not change the label, the `Input`, its `id`, or the `showRequired` paragraph.

## Boundaries

- Do NOT touch the radiogroup, the donut section, calculation logic, or `components/portfolio-distribution.tsx`.
- Do NOT add dependencies or new motion values.
- Do NOT replace this with a height-measuring hook or keyframes.
- If the baseline positions in step 1 cannot be reproduced after the change (±0.5px) in either mode, revert and report.
- If a step doesn't match the code you find (drift since the commit stamp), STOP and report instead of improvising.

## Verification

- **Mechanical**:
  - `pnpm install --frozen-lockfile` (first time only).
  - `pnpm test` → passes.
  - `pnpm build` → succeeds; also `pnpm exec tsc --noEmit -p tsconfig.json` shows no new error in `components/rebalance-calculator.tsx` (the build ignores type errors).
  - `pnpm verify` → passes (if it cannot run for network reasons, say so).
  - `pnpm lint` is broken by design (`AGENTS.md`); skip it.
- **Feel check**: on `/herramientas/rebalanceo` with at least one holding:
  - Layout parity: the donut card's `top` in both modes equals the baseline from step 1 at 1280px and 390px.
  - Switch to "accumulate": the block grows and fades in over 360ms and the donut card glides down. Switch back: it collapses and the card glides up.
  - Toggle rapidly: the height reverses from where it is, never restarting.
  - Collapsed: pressing Tab from the radios skips the hidden input; `document.getElementById("rebalance-contribution").closest("[inert]")` is not null.
  - Expanded: focus the input; the red focus outline is fully visible on all four sides (not clipped).
  - The saved contribution value survives a mode switch and a reload, as before.
  - DevTools → Animations at 10%: no overshoot; text is clipped at the bottom edge while growing.
  - Emulate `prefers-reduced-motion: reduce`: no height animation; the block fades in at full size.
- **Done when**: mechanical checks pass, layout parity holds, and the focus outline is not clipped.
