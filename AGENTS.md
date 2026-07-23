# AGENTS.md

## Cursor Cloud specific instructions

This is a single Next.js 16 (App Router, React 19, Turbopack, Tailwind CSS v4) frontend app named "cedears". It has no backend or database. The one page fetches a public JSON of Argentine CEDEARs from `raw.githubusercontent.com` (see `lib/cedears.ts`) and renders a searchable/filterable table with Markdown/CSV export. Rendering the data therefore requires outbound network access to GitHub; if that fetch fails the page shows an "Error al cargar los datos" alert instead of the table.

The app can run under **Next.js** or **vinext** (Vite) side-by-side. Next.js remains the default local workflow; vinext targets Cloudflare Workers deployment.

- Package manager is `pnpm` (see `pnpm-lock.yaml`). Standard scripts live in `package.json`.
- **Next.js:** `pnpm dev` (http://localhost:3000), `pnpm build`, `pnpm start`.
- **vinext:** `pnpm run dev:vinext` (http://localhost:3001), `pnpm run build:vinext`, `pnpm run deploy:vinext`.
- **Cloudflare Workers:** vinext deploys via `wrangler.jsonc`. `nodejs_compat` is required for `yahoo-finance2`.
- **Secrets / env:** set `NEXT_PUBLIC_SITE_URL` and `FINNHUB_API_KEY` via `wrangler secret put` or the Cloudflare dashboard before deploy.
- **KV:** `VINEXT_KV_CACHE` id is set in `wrangler.jsonc` (vinext data/ISR cache). Custom domain: `cedears.com` via Workers Custom Domains.
- `pnpm lint` currently fails: the script is `eslint .` but `eslint` and an ESLint config are not part of the repo dependencies. This is the repo's shipped state, not a broken environment setup. Do not add ESLint unless the task asks for it.
- `next.config.mjs` sets `typescript.ignoreBuildErrors: true` and `images.unoptimized: true`, so type errors do not fail the build.
- `pnpm install` may log ignored build scripts for `esbuild`, `workerd`, `sharp`, or `msw`. These are listed in `package.json` under `pnpm.onlyBuiltDependencies` and are expected; they are optional for Next.js-only workflows but needed for vinext/Cloudflare builds.

## Design system

Visual identity for UI work lives in [`DESIGN.md`](./DESIGN.md) ([design.md](https://github.com/google-labs-code/design.md) format). Read it before changing layout, color, typography, or shared components. Tokens in YAML front matter are normative; prose explains how to apply them. Keep new screens aligned with the existing Stone Utility shell (`max-w-5xl`, Geist, shadcn `base-nova` / stone).
