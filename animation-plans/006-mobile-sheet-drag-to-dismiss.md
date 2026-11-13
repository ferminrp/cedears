# 006 — Drag-to-dismiss on the mobile detail sheet

- **Status**: TODO — **needs a real device and an explicit go-ahead; not for automatic execution**
- **Commit**: 864a784
- **Severity**: LOW
- **Category**: Missed opportunities (gesture seam) / Interruptibility
- **Estimated scope**: 1 new file (`components/ui/drawer.tsx`) + 1 edited file (`components/cedear-detail-sheet.tsx`), ~120 lines

> Do not execute this plan as part of a batch. It adds a new interaction, its feel cannot be judged from code or a headless browser, and it must be tried on a physical phone (iOS Safari and Android Chrome) before merging. Run it only when the repo owner has said to.

## Problem

Below 768px the CEDEAR detail opens as a bottom sheet. It can be closed only with the X button or by tapping the backdrop; it cannot be dragged down, which is the gesture people expect from a bottom sheet.

```tsx
/* components/cedear-detail-sheet.tsx:29-37 — current */
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isDesktop ? "right" : "bottom"}
        className={
          isDesktop
            ? "w-full gap-0 overflow-hidden sm:max-w-md"
            : "max-h-[85vh] gap-0 overflow-hidden rounded-t-xl"
        }
      >
```

`Sheet` is Base UI's `Dialog` (`components/ui/sheet.tsx:4`: `import { Dialog as SheetPrimitive } from "@base-ui/react/dialog"`), which has no swipe handling.

Frequency: occasional. Purpose: feedback / spatial consistency.

## Target

Use the Drawer that Base UI already ships instead of hand-writing pointer handlers. Verified against the published `@base-ui/react@1.5.0` tarball (the version pinned in `pnpm-lock.yaml:248`):

- `@base-ui/react/drawer` is exported and stable (CHANGELOG: "`Drawer` is now stable and should be imported as `{ Drawer } from '@base-ui/react/drawer'`").
- Parts: `Root`, `Portal`, `Backdrop`, `Viewport`, `Popup`, `Content`, `Title`, `Description`, `Close`, `SwipeArea`, `Trigger`, `Provider`, `Indent`, `IndentBackground`.
- `Drawer.Root` props include `open`, `onOpenChange`, `onOpenChangeComplete`, `swipeDirection` (default `'down'`), `snapPoints`.
- `Drawer.Popup` exposes CSS variables `--drawer-swipe-movement-y`, `--drawer-swipe-movement-x`, `--drawer-snap-point-offset`, `--drawer-swipe-strength` (a 0.1–1 scalar for scaling the release duration), `--drawer-height`; and data attributes `data-starting-style`, `data-ending-style`, `data-swiping`, `data-swipe-dismiss`, `data-swipe-direction`. `Drawer.Backdrop` exposes `--drawer-swipe-progress`.

The library owns tracking, velocity-based dismissal and boundary damping; this plan only wires it and styles it with the theme's tokens.

Behaviour to end up with (mobile only; desktop keeps the existing right-side `Sheet` untouched):

- While the finger is down (`data-swiping`), the popup follows 1:1 with **no transition**: `transform: translateY(calc(var(--drawer-snap-point-offset, 0px) + var(--drawer-swipe-movement-y, 0px)))`.
- On release below the dismiss threshold, it settles back with `transition: transform var(--motion-large-duration) var(--motion-large-easing)` (`360ms`, `cubic-bezier(0.22, 1, 0.36, 1)`). The theme sets `--motion-large-type: easing` (`app/globals.css:169`), so use the easing tokens, not a spring.
- On dismiss (`data-ending-style`), it leaves through the bottom edge: `transform: translateY(100%)` on the same tokens. Enter (`data-starting-style`) comes from `translateY(100%)` too, so enter and exit share an edge.
- Backdrop opacity follows the drag: `opacity: calc(1 - var(--drawer-swipe-progress, 0))`, with the existing `transition-opacity duration-[var(--motion-duration)] ease-[var(--motion-easing)]` when not swiping.
- A visible grab handle at the top of the sheet (36×4px, `rounded-full bg-neutral-4`, centred, `aria-hidden`), so the gesture is discoverable.
- The scrollable body (`components/cedear-detail-sheet.tsx:58`, `overflow-y-auto`) must still scroll; a downward drag dismisses only when that body is scrolled to the top or the drag starts on the header/handle.
- `prefers-reduced-motion: reduce`: dragging still works (it is direct manipulation), but the release/enter/exit use `transition: opacity var(--motion-large-duration) var(--motion-large-easing)` with no transform transition.
- X button, backdrop tap and Escape keep working. Focus is trapped and restored as today.

No new motion values: only `--motion-duration`, `--motion-easing`, `--motion-large-duration`, `--motion-large-easing`.

## Repo conventions to follow

- Shared primitives live in `components/ui/` as thin wrappers around Base UI parts with `data-slot` attributes and `cn(...)`; copy the structure of `components/ui/sheet.tsx` (same typography, `bg-popover`, `shadow-[var(--shadow-m)]`, radius and spacing tokens, same close button built from `Button variant="ghost" size="icon-sm"`).
- `AGENTS.md` asks agents to use the `gestures` and `emil-design-eng` skills in `.cursor/skills/` for gesture work and `review-animations` before a PR with visual changes. Read them before starting.
- Plan 001 changes the same component. Execute 001 first; this plan must preserve its `lastCedear` / `onOpenChangeComplete` logic (pass `onOpenChangeComplete` to `Drawer.Root` as well).

## Steps

1. Confirm the go-ahead exists. If you were not explicitly told to run plan 006, STOP.
2. Read `node_modules/@base-ui/react/drawer/**/*.d.ts` and the Drawer docs (https://base-ui.com/react/components/drawer) for the installed version. If any part, prop, CSS variable or data attribute named in Target is missing or renamed, STOP and report; do not substitute a hand-written gesture.
3. Create `components/ui/drawer.tsx`: wrappers `Drawer`, `DrawerContent` (Portal + Backdrop + Viewport + Popup + handle + close button), `DrawerHeader`, `DrawerTitle`, `DrawerDescription`, mirroring the names and visual classes in `components/ui/sheet.tsx`, with the transform/transition rules from Target on the Popup and Backdrop.
4. In `components/cedear-detail-sheet.tsx`, render the new `Drawer` when `!isDesktop` and the existing `Sheet` when `isDesktop`, sharing the same inner content (extract the content JSX into a local `const body = (…)` or a small inner component so it is written once). Title and description must use the matching primitive's `Title`/`Description` parts in each branch so the dialog stays labelled.
5. Keep `max-h-[85vh]` on the mobile popup and the inner `min-h-0 flex-1 overflow-y-auto` scroller.

## Boundaries

- Do NOT hand-roll pointer/touch handlers, add `motion`, `vaul` or any other dependency.
- Do NOT change `components/ui/sheet.tsx`, the desktop sheet, `components/site-nav.tsx` (it also uses `Sheet`), or `components/cedears-list.tsx`.
- Do NOT introduce new durations, curves, springs or snap points.
- Do NOT mark this plan DONE without the device check below; a headless pass is not sufficient.
- If a step doesn't match the code you find (drift since the commit stamp), STOP and report instead of improvising.

## Verification

- **Mechanical**:
  - `pnpm install --frozen-lockfile` (first time only).
  - `pnpm test` → passes.
  - `pnpm build` → succeeds; `pnpm exec tsc --noEmit -p tsconfig.json` shows no new errors in the two files.
  - `pnpm verify` → passes. It exercises the detail sheet; if a selector such as `[data-slot="sheet-content"]` is asserted on mobile widths and now fails, STOP and report rather than editing the script.
  - `pnpm lint` is broken by design (`AGENTS.md`); skip it.
- **Feel check (real phone required — iOS Safari and Android Chrome)**: via `pnpm dev` on the LAN or a preview deploy.
  - Drag the sheet down slowly and let go before a quarter of its height: it returns smoothly, with no jump at release.
  - Flick it down quickly over a short distance: it dismisses (velocity, not distance).
  - Drag past about a quarter of its height slowly and release: it dismisses.
  - Try to drag it upward: it resists and does not detach from the bottom edge.
  - Scroll the content down, then drag down inside it: the content scrolls; the sheet does not start closing until the content is at the top.
  - Grab it again mid-settle: it follows the finger immediately from where it is.
  - The backdrop lightens as the sheet goes down.
  - With "Reduce Motion" enabled in the OS: dragging works, release does not slide.
  - Desktop (≥768px): the right-side sheet is unchanged.
  - Screen reader (VoiceOver or TalkBack): the dialog is announced with the ticker and name, and the close button is reachable.
- **Done when**: all mechanical checks pass AND a person has confirmed the device checks on at least one iOS and one Android phone.
