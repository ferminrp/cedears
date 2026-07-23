# Phase 7 (optional). Drop the `next` npm package

Back: [overview.md](./overview.md)

## Goal

Prove the app builds and runs without installing the `next` package, relying on vinext shims + `@vinext/types`. Skip this phase if phase 1–6 already shipped and time/cost is tight. It is optional savings, not required for vinext-only ops.

## Changes

**Files (likely):** `package.json`, `pnpm-lock.yaml`, possibly `tsconfig.json`, `next-env.d.ts`

1. Remove `"next"` from `package.json` dependencies.
2. `pnpm install`.
3. Run `pnpm run cf:build`. If typegen fails, let vinext regenerate `next-env.d.ts` (or follow vinext FAQ for `@vinext/types`).
4. If `tsconfig.json` `"plugins": [{ "name": "next" }]` breaks the editor/build, remove that plugin entry.
5. Keep all source `import from 'next/...'` lines unchanged.
6. Keep `next.config.mjs` unless the build clearly no longer reads it (then move `serverExternalPackages` into `vite.config.ts` via `vinext({ nextConfig: { ... } })` in a follow-up, not in the same blind pass).

**Abort criteria.** If `cf:build` fails twice with non-obvious shim/type errors, revert the `next` removal and stop. Document the failure in the PR. Do not rewrite imports to “fix” it.

## Data structures

None.

## Verification

**Static.** `pnpm run cf:build` green without `next` in `node_modules`.

**Runtime.** Full [testing.md](./testing.md) smoke.

## Implementer

Composer 2.5 (not fast). Higher chance of typegen edge cases. Commit only if green: `chore: remove next package; rely on vinext shims`.
