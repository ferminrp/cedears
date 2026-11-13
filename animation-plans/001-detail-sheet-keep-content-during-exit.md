# 001 — Keep the detail sheet's content rendered while it closes

- **Status**: TODO
- **Commit**: 864a784
- **Severity**: MEDIUM
- **Category**: Missed opportunities (preventing a jarring change) / Interruptibility
- **Estimated scope**: 1 file (`components/cedear-detail-sheet.tsx`), ~12 lines

## Problem

Tapping a row in the main CEDEAR table opens a detail sheet (right side on desktop, bottom on mobile). On close, the sheet's content disappears in the same frame the exit animation starts, so the exit plays on an empty panel. On mobile the bottom sheet is `h-auto`, so it first collapses to its padding and then fades.

Cause: the parent derives both `cedear` and `open` from the same state, so when the sheet closes `cedear` becomes `null` immediately.

```tsx
/* components/cedears-list.tsx:627-633 — current (do not edit) */
      <CedearDetailSheet
        cedear={selected}
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedTicker(null)
        }}
      />
```

```tsx
/* components/cedear-detail-sheet.tsx:17-38 — current */
export function CedearDetailSheet({
  cedear,
  open,
  onOpenChange,
}: {
  cedear: Cedear | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const isDesktop = useMediaQuery("(min-width: 768px)")

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isDesktop ? "right" : "bottom"}
        className={
          isDesktop
            ? "w-full gap-0 overflow-hidden sm:max-w-md"
            : "max-h-[85vh] gap-0 overflow-hidden rounded-t-xl"
        }
      >
        {cedear ? (
```

The body (lines 38–74) reads `cedear` in seven places: line 38 (`{cedear ? (`), 43 (`cedear.TickerOriginal`), 51 (`cedear.Cedears`), 53 (`cedear.Name`), 59 (`cedear={cedear}`), 62 (`cedear.TickerOriginal`), 67 (`cedear.Cedears`), ending with `) : null}` on line 74.

The exit animation itself already exists and is correct; it must not change:

```
/* components/ui/sheet.tsx:56 — existing exit (do not edit) */
transition duration-[var(--motion-large-duration)] ease-[var(--motion-large-easing)]
data-ending-style:opacity-0 … data-[side=bottom]:data-ending-style:translate-y-[2.5rem] … data-[side=right]:data-ending-style:translate-x-[2.5rem]
```

Resolved: `--motion-large-duration` = `360ms`, `--motion-large-easing` = `cubic-bezier(0.22, 1, 0.36, 1)` (`app/globals.css:167-168`).

Frequency: occasional (every row tap on the main list). Purpose: preventing a jarring change.

## Target

No new motion and no new values. The sheet keeps rendering the last non-null `cedear` until Base UI reports that the close animation has finished, then drops it.

`@base-ui/react` is pinned at 1.5.0 (`pnpm-lock.yaml:248`). Its `Dialog.Root` (which `Sheet` wraps and spreads props onto, `components/ui/sheet.tsx:10-12`) has `onOpenChangeComplete?: (open: boolean) => void`, "called after any animations complete when the dialog is opened or closed" (`node_modules/@base-ui/react/dialog/root/DialogRoot.d.ts`).

```tsx
/* components/cedear-detail-sheet.tsx — target (top of file and start of component) */
"use client"

import { useState } from "react"
import type { Cedear } from "@/lib/cedears"
// …other imports unchanged…

export function CedearDetailSheet({
  cedear,
  open,
  onOpenChange,
}: {
  cedear: Cedear | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const isDesktop = useMediaQuery("(min-width: 768px)")
  // Keep the last opened CEDEAR rendered while the sheet plays its exit.
  const [lastCedear, setLastCedear] = useState<Cedear | null>(cedear)
  if (cedear && cedear !== lastCedear) setLastCedear(cedear)
  const shown = cedear ?? lastCedear

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      onOpenChangeComplete={(nextOpen) => {
        if (!nextOpen) setLastCedear(null)
      }}
    >
      <SheetContent
        side={isDesktop ? "right" : "bottom"}
        className={
          isDesktop
            ? "w-full gap-0 overflow-hidden sm:max-w-md"
            : "max-h-[85vh] gap-0 overflow-hidden rounded-t-xl"
        }
      >
        {shown ? (
```

…and every remaining `cedear` inside that JSX branch becomes `shown` (`shown.TickerOriginal`, `shown.Cedears`, `shown.Name`, `cedear={shown}`, `tickerOriginal={shown.TickerOriginal}`, `` href={`/cedear/${shown.Cedears}`} ``). The prop passed to `CedearDetailView` keeps its name: `<CedearDetailView cedear={shown} />`.

Why this shape:

- Calling `setLastCedear` during render when a prop changes is React's documented "adjust state when a prop changes" pattern; it is guarded so it cannot loop.
- `shown = cedear ?? lastCedear` means a newly selected row always wins, so re-opening on another row during the exit shows the new content immediately even if the close-complete callback fires late.
- If `onOpenChangeComplete` never fired, nothing breaks: the sheet is closed and `lastCedear` is simply replaced on the next open.

## Repo conventions to follow

- Client components start with `"use client"` and import React hooks by name, e.g. `components/copy-button.tsx:3` (`import { useEffect, useRef, useState } from "react"`).
- Import alias `@/…`; double quotes; no semicolons; 2-space indent (match the file).
- Do not touch `components/ui/*` wrappers for this; they are shared Untitled/shadcn treatments (`AGENTS.md`, "Graphical UI").

## Steps

1. In `components/cedear-detail-sheet.tsx`, add `import { useState } from "react"` directly after the `"use client"` line and its blank line (before `import type { Cedear } …`).
2. After `const isDesktop = useMediaQuery("(min-width: 768px)")`, add the comment and the three lines from Target (`useState`, the guarded `setLastCedear`, `const shown`).
3. Replace `<Sheet open={open} onOpenChange={onOpenChange}>` with the multi-line `<Sheet …>` from Target, including `onOpenChangeComplete`.
4. Inside `<SheetContent>`, rename the seven `cedear` reads listed in Problem to `shown`. Do not rename the component's `cedear` prop or the `cedear=` attribute name on `CedearDetailView`.
5. Confirm with `grep -n "cedear\b" components/cedear-detail-sheet.tsx` that the only remaining lowercase `cedear` identifiers are: the prop in the signature and its type, the three lines added in step 2, and the attribute name `cedear={shown}`.

## Boundaries

- Do NOT edit `components/cedears-list.tsx`, `components/ui/sheet.tsx`, or any other file.
- Do NOT change any class name, duration, easing or the sheet's side logic.
- Do NOT add dependencies or a `useEffect`/`useRef` variant of this logic.
- If `Dialog.Root` in the installed `@base-ui/react` has no `onOpenChangeComplete` prop (check `node_modules/@base-ui/react/dialog/root/DialogRoot.d.ts`), omit the prop and keep everything else; report that you did so.
- If a step doesn't match the code you find (drift since the commit stamp), STOP and report instead of improvising.

## Verification

- **Mechanical**:
  - `pnpm install --frozen-lockfile` (first time only; ignored-build-script notices are expected).
  - `pnpm test` → all tests pass.
  - `pnpm build` → succeeds. Note: `next.config.mjs` sets `typescript.ignoreBuildErrors: true`, so also run `pnpm exec tsc --noEmit -p tsconfig.json` and confirm it reports no error in `components/cedear-detail-sheet.tsx` (pre-existing errors elsewhere are not yours; compare with `git stash` if unsure).
  - `pnpm verify` → passes (Playwright end-to-end harness; it starts its own dev server and needs outbound access to `raw.githubusercontent.com`. If it cannot run for network reasons, say so; do not claim it passed).
  - `pnpm lint` is broken by design (`AGENTS.md`); do not run it or try to fix it.
- **Feel check**: `pnpm dev` (http://localhost:3000), wait for the table.
  - Desktop (≥768px): click a row, then press Escape. The panel slides/fades out with the ticker, name and details still visible until it is gone. It must never show a blank panel.
  - Mobile (e.g. 390px wide): tap a row, tap the backdrop. The bottom sheet keeps its full height while it fades and moves down 2.5rem; it must not shrink to a thin strip first.
  - In DevTools → Animations, set playback to 10% and repeat both; content stays for the whole exit.
  - Close and, during the exit, click a different row: the sheet shows the new CEDEAR, not the old one.
  - After the exit finishes, `document.querySelector('[data-slot="sheet-content"]')` is `null` (the popup unmounts as before).
  - Emulate `prefers-reduced-motion: reduce`: behaviour is unchanged from before this plan (this plan adds no motion).
- **Done when**: the mechanical checks pass and, in a scripted or manual check ~100ms after closing, the popup's text still contains the selected ticker.
