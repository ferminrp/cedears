# Animation plans — cedears

Self-contained implementation plans from a `find-animation-opportunities` sweep, written with the `improve-animations` plan template. They live in `animation-plans/` because `plans/` already holds unrelated work.

Recon stamp: `864a784` (branch `claude/admiring-albattani-mlusgg`).

## Recon

| Fact | Detail |
| --- | --- |
| **Stack** | vinext (Vite) on Cloudflare Workers, React 19, Tailwind CSS v4 + `tw-animate-css`, `@base-ui/react` 1.5.0 (lockfile), shadcn `base-nova` wrappers, sonner |
| **Motion libs** | None. Motion is CSS + Tailwind utilities + Base UI `data-starting-style` / `data-ending-style` |
| **Tokens** | `app/globals.css:160-174`. Small: `--motion-duration: 200ms`, `--motion-easing: cubic-bezier(0.16, 1, 0.3, 1)`. Large: `--motion-large-duration: 360ms`, `--motion-large-easing: cubic-bezier(0.22, 1, 0.36, 1)`. Also `--motion-popup-scale: 0.96`, `--motion-press-distance: 1px` |
| **Token roles** | `gui/foundations.md`: controls, menus, small popovers → small curve; dialogs, drawers, toast, navigation surfaces, disclosure panels → large curve. `GUI.md` forbids introducing new motion values, so every plan uses only these tokens |
| **Personality** | Crisp, data-dense finance utility; mostly SSR/SEO pages. Very small motion budget |
| **High frequency** | Tables, sort, search, filters, combobox results — no motion planned |
| **Occasional** | Detail sheet, menus, FAQs, calculators |
| **Already right** | Dropdown/Select scale from the trigger origin; Sheet enter/exit on the large curve; navigation progress bar with reduced-motion branch; `portfolio-distribution` disclosure |
| **Verify commands** | `pnpm test`, `pnpm build`, `pnpm verify` (Playwright harness, needs network to `raw.githubusercontent.com`). `pnpm lint` is broken by design (`AGENTS.md`). The build ignores type errors, so plans that touch TS also run `pnpm exec tsc --noEmit -p tsconfig.json` |

## Plans

| # | Title | Severity | Status | Depends on | Files touched |
| --- | --- | --- | --- | --- | --- |
| 001 | Keep the detail sheet's content rendered while it closes | MEDIUM | DONE | — | `components/cedear-detail-sheet.tsx` |
| 002 | Make the press state actually transition (Button) and add it to CopyButton | MEDIUM | DONE | — | `components/ui/button.tsx`, `components/copy-button.tsx` |
| 003 | Animate native `<details>` open/close (FAQs and MCP example) | LOW | DONE | — | `app/globals.css`, `components/cedear-faqs.tsx`, `app/(site)/mcp-docs/page.tsx` |
| 004 | Fade in the company profile when it replaces its skeleton | LOW | TODO | — | `components/cedear-company-profile.tsx` |
| 005 | Reveal the "¿Cuánto querés invertir?" block instead of popping it in | LOW | TODO | — | `components/rebalance-calculator.tsx` |
| 006 | Drag-to-dismiss on the mobile detail sheet | LOW | TODO — **needs a real device and an explicit go-ahead; not for automatic execution** | 001 | `components/ui/drawer.tsx` (new), `components/cedear-detail-sheet.tsx` |

## Recommended execution order

001 → 002 → 003 → 004 → 005. Stop there.

- 001 has the highest leverage: it adds no motion, it lets the sheet's existing exit play on real content.
- 002 is a one-word fix plus one class string.
- 003–005 are modest polish. 005 is the most marginal; drop it first.
- **006 is not part of the automatic batch.** It is a new interaction whose feel can only be judged on a physical phone. Run it only after an explicit go-ahead, and do not mark it DONE without the device check in the plan.

## Dependencies and shared files

- 001–005 touch disjoint files and are independent; they can run in any order, but running them sequentially in one working tree is simplest.
- 001 and 006 both edit `components/cedear-detail-sheet.tsx`. 006 must run after 001 and must keep 001's `lastCedear` / `onOpenChangeComplete` logic.
- 003 is the only plan that edits `app/globals.css`.
- 003 note: `scripts/verify-cedears.mjs:787` opens every `<details>` on `/mcp` and immediately takes a screenshot, which may now catch panels mid-transition. Only the saved image is affected; the plan says to stop if an assertion fails.

## Facts checked while writing

- `@base-ui/react@1.5.0` (published tarball): `Dialog.Root` has `onOpenChangeComplete?: (open: boolean) => void` (used by 001).
- The same version ships a stable `Drawer` at `@base-ui/react/drawer`, with a `SwipeArea` part, `swipeDirection` and `snapPoints` props, and `--drawer-swipe-movement-y` / `data-swiping` hooks. Plan 006 therefore uses it instead of hand-written pointer handlers.
- No `node_modules` in the checkout when these were written: nothing was built or run, and nothing was observed in a browser.

## Considered and not planned

| Item | Why |
| --- | --- |
| Combobox results list (`components/cedear-picker.tsx:141`) | Keyboard-initiated, re-rendered per keystroke. Never animate |
| Pinned row moving to the top (`components/cedears-list.tsx:486-506`) | Needs FLIP / View Transitions across a dense data table with no motion library; the pinned row already has a persistent marker |
| Route content transitions (`components/site-shell.tsx:66-72`) | Core navigation; the instant swap with the progress bar is a deliberate decision |
| Donut arcs, composition bar, table row add/remove, sort icons | Data the user is reading, updated per keystroke |
| Hold-to-confirm on "Vaciar cartera" (`components/rebalance-calculator.tsx:418`) | Already has an Undo toast, which is better than a 2s hold |

## Residual backlog (outside these plans)

- `components/portfolio-distribution.tsx:30,63` hardcodes `duration-200 ease-out` instead of the motion tokens.
- Sheet, menu and select motion have no `prefers-reduced-motion` handling, and `--motion-enabled` (`app/globals.css:165`) is never read.
