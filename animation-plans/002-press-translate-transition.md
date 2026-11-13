# 002 — Make the press state actually transition (Button) and add it to CopyButton

- **Status**: TODO
- **Commit**: 864a784
- **Severity**: MEDIUM
- **Category**: Easing & duration / Cohesion & tokens (feedback)
- **Estimated scope**: 2 files, 2 class strings

## Problem

The theme defines a press idiom: the control moves down `--motion-press-distance` (1px) while held. `Button` applies it, but the movement is not transitioned, so it snaps down and back.

Tailwind v4's `translate-y-*` utilities set the CSS `translate` property, not `transform`. The Button's transition list names `transform`, which no longer covers it:

```
/* components/ui/button.tsx:7 — current (excerpt of the cva base string) */
… whitespace-nowrap transition-[background,color,box-shadow,transform] duration-[var(--motion-duration)] ease-[var(--motion-easing)] outline-none select-none … active:not-aria-[haspopup]:translate-y-[var(--motion-press-distance)] disabled:pointer-events-none …
```

`CopyButton` (the green "Copiar" buttons on `/mcp`, used at `app/(site)/mcp-docs/page.tsx:90` and `:174`) is a hand-written `<button>` with no press state at all, and its transition uses Tailwind's default timing instead of the theme tokens:

```tsx
/* components/copy-button.tsx:39 — current */
          "inline-flex min-h-11 min-w-24 shrink-0 touch-manipulation items-center justify-center rounded-[var(--radius-m)] bg-success px-4 text-sm font-medium text-white transition-[box-shadow,background-color] hover:shadow-[var(--shadow-s)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
```

Frequency: tens/day (Button is every button in the app), so the motion must stay near-imperceptible. Purpose: feedback.

## Target

Button — one word changes (`transform` → `translate`); everything else in the string stays byte-for-byte:

```
/* components/ui/button.tsx:7 — target (same excerpt) */
… whitespace-nowrap transition-[background,color,box-shadow,translate] duration-[var(--motion-duration)] ease-[var(--motion-easing)] outline-none select-none … active:not-aria-[haspopup]:translate-y-[var(--motion-press-distance)] disabled:pointer-events-none …
```

CopyButton — add `translate` to the list, put the list on the small-motion tokens, add the press state:

```tsx
/* components/copy-button.tsx:39 — target */
          "inline-flex min-h-11 min-w-24 shrink-0 touch-manipulation items-center justify-center rounded-[var(--radius-m)] bg-success px-4 text-sm font-medium text-white transition-[box-shadow,background-color,translate] duration-[var(--motion-duration)] ease-[var(--motion-easing)] hover:shadow-[var(--shadow-s)] active:translate-y-[var(--motion-press-distance)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
```

Resolved values (all existing tokens, `app/globals.css:160-161,174`): `--motion-duration` = `200ms`, `--motion-easing` = `cubic-bezier(0.16, 1, 0.3, 1)`, `--motion-press-distance` = `1px`.

Deliberate deviations, stated so nobody "fixes" them:

- 200ms is above the generic 100–160ms press budget. It is the theme's only small-motion duration and `GUI.md` forbids introducing motion values; with 1px of travel and a strong ease-out the difference is not perceptible. A faster press is a theme-level decision, not part of this plan.
- Travel stays `translate-y` 1px. Do NOT add a `scale`.
- No reduced-motion override: a 1px press is feedback, not movement to remove, and Button has none either.

## Repo conventions to follow

- Motion classes use the tokens as arbitrary values: `duration-[var(--motion-duration)] ease-[var(--motion-easing)]` — exemplar `components/ui/input.tsx:12` (`transition-[background,box-shadow] duration-[var(--motion-duration)] ease-[var(--motion-easing)]`).
- Controls use the small curve (`gui/foundations.md`, "Motion and focus").
- `components/ui/button.tsx` is a shared Untitled treatment: change only the one word.

## Steps

1. `components/ui/button.tsx:7`: in the cva base string replace `transition-[background,color,box-shadow,transform]` with `transition-[background,color,box-shadow,translate]`. Nothing else on the line changes.
2. `components/copy-button.tsx:39`: replace `transition-[box-shadow,background-color] hover:shadow-[var(--shadow-s)]` with `transition-[box-shadow,background-color,translate] duration-[var(--motion-duration)] ease-[var(--motion-easing)] hover:shadow-[var(--shadow-s)] active:translate-y-[var(--motion-press-distance)]`.
3. Run `git diff --stat` and confirm exactly these two files changed, one line each.

## Boundaries

- Do NOT touch any other class in either string, any variant, or any other component.
- Do NOT add `scale`, `motion-reduce:*`, new tokens, or new durations.
- Do NOT add dependencies.
- If a step doesn't match the code you find (drift since the commit stamp), STOP and report instead of improvising.

## Verification

- **Mechanical**:
  - `pnpm install --frozen-lockfile` (first time only).
  - `pnpm test` → passes.
  - `pnpm build` → succeeds.
  - `pnpm verify` → passes (it checks `/mcp` touch targets ≥44px; the CopyButton keeps `min-h-11`). If it cannot run for network reasons, say so.
  - `pnpm lint` is broken by design (`AGENTS.md`); skip it.
- **Feel check**: `pnpm dev`, http://localhost:3000.
  - On `/`, inspect any Button (e.g. the export menu trigger is `aria-haspopup`, so use a plain one such as a filter/clear button): `getComputedStyle(el).transitionProperty` includes `translate`; `transitionDuration` is `0.2s`.
  - Hold the mouse down on it: `getComputedStyle(el).translate` is `0px 1px`; on release it returns to `none`. At 10% playback (DevTools → Animations) the 1px move is eased, not a snap.
  - A Button with `aria-haspopup` (menu/select trigger) still does not move when pressed.
  - On `/mcp`, hold a green "Copiar" button: same `0px 1px`, same timing; the hover shadow still appears; "✓ Copiado" still shows after click.
  - Keyboard: Tab to a button and press Enter/Space; focus outline is intact and the button is not left offset.
- **Done when**: both computed-style checks hold and the mechanical checks pass.
