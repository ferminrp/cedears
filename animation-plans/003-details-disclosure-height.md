# 003 — Animate native `<details>` open/close (FAQs and MCP example)

- **Status**: TODO
- **Commit**: 864a784
- **Severity**: LOW
- **Category**: Missed opportunities (state indication)
- **Estimated scope**: 3 files — one CSS block in `app/globals.css`, one class string each in `components/cedear-faqs.tsx` and `app/(site)/mcp-docs/page.tsx`

## Problem

The app has exactly two native `<details>` disclosures. Both snap open and shut, so the content below jumps; only the chevron glyph rotates, and it does so on Tailwind's default timing rather than the theme tokens.

```tsx
/* components/cedear-faqs.tsx:49-63 — current (FAQ block on ticker, category, dividendos and MCP pages) */
          <details key={faq.question} className="group px-4 py-1">
            <summary className="cursor-pointer list-none py-3 text-sm font-medium marker:content-none [&::-webkit-details-marker]:hidden">
              <span className="flex items-start justify-between gap-3">
                {faq.question}
                <span
                  aria-hidden
                  className="mt-0.5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                >
                  ▾
                </span>
              </span>
            </summary>
            <p className="pb-4 text-sm leading-relaxed text-muted-foreground">
              {faq.answerNode ?? faq.answer}
            </p>
```

```tsx
/* app/(site)/mcp-docs/page.tsx:142-146 — current */
                <details className="group min-w-0">
                  <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 text-sm font-medium marker:content-none [&::-webkit-details-marker]:hidden">
                    <span aria-hidden className="transition-transform group-open:rotate-90 motion-reduce:transition-none">▸</span>
                    Ver respuesta de ejemplo
                  </summary>
```

`app/globals.css` has no rule for `details` (640 lines; `@layer base` starts at line 548, `@layer components` at 570, `@layer utilities` at 636).

Frequency: occasional. Purpose: state indication.

## Target

CSS-only, no JavaScript, no markup change. Disclosure panels use the theme's **large** curve (`gui/foundations.md`: "dialogs, drawers, toast, navigation surfaces, and disclosure panels use the Large curve"). Existing tokens: `--motion-large-duration` = `360ms`, `--motion-large-easing` = `cubic-bezier(0.22, 1, 0.36, 1)`.

Add inside the existing `@layer base { … }` block in `app/globals.css` (append as the last rules in that block, before its closing `}`):

```css
  /* Native disclosure: animate height + opacity where supported; older browsers keep the instant toggle. */
  details {
    interpolate-size: allow-keywords;
  }
  details::details-content {
    block-size: 0;
    opacity: 0;
    overflow-y: clip;
    transition:
      block-size var(--motion-large-duration) var(--motion-large-easing),
      opacity var(--motion-large-duration) var(--motion-large-easing),
      content-visibility var(--motion-large-duration) allow-discrete;
  }
  details[open]::details-content {
    block-size: auto;
    opacity: 1;
  }
  @media (prefers-reduced-motion: reduce) {
    details::details-content {
      transition:
        opacity var(--motion-large-duration) var(--motion-large-easing),
        content-visibility var(--motion-large-duration) allow-discrete;
    }
    details:not([open])::details-content {
      block-size: auto;
    }
  }
```

Notes:

- Height is the documented exception to "transform and opacity only" for accordions.
- These are transitions, not keyframes, so toggling quickly retargets from the current height.
- `interpolate-size` is inherited, so setting it on `details` reaches `::details-content` without affecting the rest of the page.
- Browsers without `::details-content` or `interpolate-size` ignore the rules or jump to the end state; that is today's behaviour and is acceptable. Do not add a JS fallback.
- Reduced motion: no height movement, opacity fade only (the closed panel is still hidden by `content-visibility`).

Chevrons go onto the same tokens (in Tailwind v4 `transition-transform` covers `rotate`, so only timing is added):

```tsx
/* components/cedear-faqs.tsx:55 — target */
                  className="mt-0.5 shrink-0 text-muted-foreground transition-transform duration-[var(--motion-large-duration)] ease-[var(--motion-large-easing)] group-open:rotate-180 motion-reduce:transition-none"
```

```tsx
/* app/(site)/mcp-docs/page.tsx:144 — target */
                    <span aria-hidden className="transition-transform duration-[var(--motion-large-duration)] ease-[var(--motion-large-easing)] group-open:rotate-90 motion-reduce:transition-none">▸</span>
```

## Repo conventions to follow

- Global element rules live in `@layer base` in `app/globals.css` (line 548). Literal values belong only in token definitions; use sites reference the `--motion-*` variables (`GUI.md`, "Rules for UI work").
- Token usage in class strings: `duration-[var(--motion-large-duration)] ease-[var(--motion-large-easing)]`, exemplar `components/ui/sheet.tsx:56`.
- Reduced-motion class convention already in the repo: `motion-reduce:transition-none` (`app/(site)/mcp-docs/page.tsx:144`).

## Steps

1. Open `app/globals.css`, find the `@layer base {` block that starts at line 548, and append the CSS from Target as the last rules inside it (2-space indentation, matching the block).
2. `components/cedear-faqs.tsx:55`: replace the `className` string with the target string.
3. `app/(site)/mcp-docs/page.tsx:144`: replace the `className` string with the target string.

## Boundaries

- Do NOT change the `<details>`/`<summary>` markup, the FAQ data, or any other class.
- Do NOT convert these to a JS accordion or add a dependency.
- Do NOT introduce new durations or curves; only the four existing `--motion-*` duration/easing tokens may be referenced.
- Do NOT edit `scripts/verify-cedears.mjs`. Line 787 opens every `<details>` on `/mcp` programmatically and immediately takes a full-page screenshot; with this change that screenshot may catch the panels mid-transition. That affects only the saved image, not an assertion. If an assertion fails because of it, STOP and report.
- If a step doesn't match the code you find (drift since the commit stamp), STOP and report instead of improvising.

## Verification

- **Mechanical**:
  - `pnpm install --frozen-lockfile` (first time only).
  - `pnpm test` → passes.
  - `pnpm build` → succeeds; then confirm the built CSS contains `::details-content` (e.g. `grep -rl "details-content" dist | head`). If the CSS pipeline dropped or mangled the selector, STOP and report.
  - `pnpm verify` → passes (if it cannot run for network reasons, say so).
  - `pnpm lint` is broken by design (`AGENTS.md`); skip it.
- **Feel check**: `pnpm dev`, open a page with FAQs (e.g. `/cedear/AAPL`) in a current Chromium.
  - Click a question: the answer grows from 0 to its height while fading in; the questions below slide down smoothly rather than jumping. Click again: it collapses and fades.
  - Click open/close rapidly: the height reverses from where it is; it never restarts from 0 or from full.
  - `getComputedStyle(details, "::details-content").transitionDuration` includes `0.36s`.
  - DevTools → Animations at 10%: no overshoot, content is clipped at the bottom edge while growing (no text spilling over the next question).
  - `/mcp`: "Ver respuesta de ejemplo" expands the same way; the long `<pre>` does not cause horizontal page scroll during the transition.
  - Judge whether 360ms reads slow on a two-line answer. It is the documented disclosure token; if it feels slow, report it rather than changing the value.
  - Emulate `prefers-reduced-motion: reduce`: the panel does not grow; it fades in at full height. Chevrons flip instantly.
  - With JavaScript disabled the FAQs still open and close (it is pure CSS).
- **Done when**: mechanical checks pass and the open/close height transition is observed in Chromium with the token timing.
