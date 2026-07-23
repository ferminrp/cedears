# Vinext-only cleanup

## Context

Production already runs on vinext + Cloudflare Workers. Next.js is no longer used as a local or production runtime. The repo still carries Next CLI scripts, dual-workflow docs, dead Cloudflare Images wiring (no `next/image`), orphan `next-themes`, and pages that fetch live data without a segment `revalidate`.

This plan removes that leftover and aligns cache + docs with a single vinext workflow.

## Scope

**Included**

1. Promote vinext scripts to `dev` / `build` / `start` / `deploy`. Drop Next CLI scripts.
2. Rewrite `README.md` and `AGENTS.md` for vinext-only.
3. Remove unused image optimization config (`imagesOptimizer`, `IMAGES` binding, `images.unoptimized`).
4. Add `export const revalidate` on pages that fetch live data but lack it.
5. Remove unused `CEDEAR_BASES_CACHE_TAG` (no `revalidateTag` callers).
6. Fix `getSiteUrl()` local fallback to vinext's port.
7. Drop orphan `next-themes` from Sonner.
8. Fix root metadata `generator`.
9. Optional last phase: try removing the `next` npm package after a green `cf:build` (vinext shims still resolve `next/*` imports).

**Excluded**

- Rewriting every `next/*` import to vinext-native paths. Shims already resolve them. No user-facing gain.
- Finnhub / `FINNHUB_API_KEY` (already configured).
- Adding ESLint.
- Migrating logos to `next/image` or Cloudflare Images.
- Changing `generateStaticParams` for ~428 CEDEAR pages. That is a build-cost / SEO tradeoff that needs measurement first. Track as a follow-up, not this plan.
- Wiring a real theme system / dark-mode toggle.
- Deleting `next.config.mjs` wholesale. Keep it for `serverExternalPackages: ['yahoo-finance2']` unless phase 8 proves inline `nextConfig` in Vite is enough.
- Removing `react-server-dom-webpack` or `webpack` without a green vinext build proving they are unused.

## Constraints

- Package manager: `pnpm`.
- Prod path: `pnpm run cf:build` then `pnpm run cf:deploy` (Workers Builds). Do not break those script names without updating Cloudflare dashboard docs in the same PR.
- vinext still loads `next.config.*` when present. Keep `serverExternalPackages`.
- App code keeps `import from 'next/link'` etc. Runtime is vinext shims, not the Next server.
- Design system in `DESIGN.md` is unchanged (no visual work).
- No new dependencies.
- Implementer model: **Composer 2.5** (`composer-2.5` or `composer-2.5-fast`). Phases are sized for that (2–3 files, mechanical, verify after each).

## Alternatives

| Approach | Pros | Cons |
|---|---|---|
| A. Dual stack forever | Zero churn | Local ≠ prod; dead scripts confuse agents |
| B. Vinext-only scripts + prune dead config (chosen) | Matches prod; small reversible diffs | Leaves `next` package until optional phase |
| C. Big-bang delete `next` + rewrite imports | Cleaner deps | Large blast radius for Composer; typegen risk |

Chose **B**. Optional phase 8 is the only place that touches removing the `next` package, and it is gated on a green build.

## Applicable skills

- **how** before editing unfamiliar vinext cache / wrangler bits.
- **laziness-protocol** / **subtract-before-you-add**: delete dead config first; do not invent new abstractions.
- **prove-it-works**: each phase ends with `cf:build` or a targeted vinext smoke, not “it typechecks”.
- **sequence-verifiable-units**: one shippable phase at a time.
- `/deslop` before each commit. **unslop** on any prose (README / AGENTS).
- **babysit** after the PR opens.
- Skip **interrogate** unless someone proposes rewriting all `next/*` imports or dropping `generateStaticParams` mid-flight.

## Phases

1. [phase-1-scripts.md](./phase-1-scripts.md) — package.json scripts only
2. [phase-2-docs.md](./phase-2-docs.md) — README + AGENTS
3. [phase-3-dead-images.md](./phase-3-dead-images.md) — vite + wrangler + next.config images strip
4. [phase-4-revalidate-pages.md](./phase-4-revalidate-pages.md) — portfolio / earnings / herramientas
5. [phase-5-cache-tag-siteurl.md](./phase-5-cache-tag-siteurl.md) — tag removal + localhost port
6. [phase-6-orphans.md](./phase-6-orphans.md) — next-themes + generator metadata
7. [phase-7-optional-drop-next-pkg.md](./phase-7-optional-drop-next-pkg.md) — optional `next` package removal
8. [testing.md](./testing.md) — full smoke checklist

## Verification (project-level)

```bash
pnpm install
pnpm run cf:build
pnpm run start   # after script rename: wrangler dev on dist/server/wrangler.json
```

Smoke: `/`, `/portfolio`, `/earnings`, `/cedear/AAPL`, `/cedears.csv`, `/api/logo/AAPL`.

Details in [testing.md](./testing.md).

## Implementation guidance

**Model.** Run each phase with Composer 2.5. Prefer `composer-2.5-fast` for mechanical edits (scripts, docs, one-line revalidate). Use `composer-2.5` only if a phase fails verification and needs a retry with more context.

**Prompt shape for each phase.** Paste the phase file path, say “implement only this phase”, list the 2–3 files, and require the phase Verification section before commit.

**One PR or stacked?** Prefer **one PR** with commits per phase (cheaper review). Split only if phase 7 (drop `next`) is contested.

**Do not** ask the human which port to use. Use **3000** as the single vinext dev port after renaming scripts (matches old mental model and `getSiteUrl` fallback after phase 5). Update `dev` to `vinext dev --port 3000`.

**Principles that drove scope cuts**

- **Laziness protocol:** keep `next/*` imports; do not rewrite.
- **Subtract before you add:** remove dead Images wiring before any new image path.
- **Never block on the human:** Finnhub confirmed OK; port choice decided here; `generateStaticParams` deferred with a written reason.
- **Prove it works:** phase 7 is optional and build-gated.
