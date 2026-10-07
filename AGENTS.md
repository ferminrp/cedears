# AGENTS.md

## Cursor Cloud specific instructions

This is a single frontend app named "cedears" on **vinext** (Vite), React 19, and Tailwind CSS v4, deployed to Cloudflare Workers. It has no backend or database. The one page fetches a public JSON of Argentine CEDEARs from `raw.githubusercontent.com` (see `lib/get-cedears.ts`) and renders a searchable/filterable table with Markdown/CSV export. Rendering the data therefore requires outbound network access to GitHub; if that fetch fails the page shows an "Error al cargar los datos" alert instead of the table.

- Package manager is `pnpm` (see `pnpm-lock.yaml`). Standard scripts live in `package.json`.
- **Local dev:** `pnpm dev` (http://localhost:3000).
- **Build / local Workers preview:** `pnpm build`, then `pnpm start` (uses `dist/server/wrangler.json`).
- **Deploy:** `pnpm deploy` (sets `NEXT_PUBLIC_SITE_URL=https://cedears.com` and runs `vinext-cloudflare deploy`).
- **Cloudflare Workers:** vinext deploys via `wrangler.jsonc`. `nodejs_compat` is required for `yahoo-finance2`.
- **Workers Builds CI:** do **not** use the default `npx wrangler deploy`. Build with `pnpm run cf:build`, deploy with `pnpm run cf:deploy` (uses `dist/server/wrangler.json`). Preview branches: `pnpm run cf:preview`. Configure these under Workers → cedears → Settings → Builds.
- **Secrets / env:** set `NEXT_PUBLIC_SITE_URL` and `FINNHUB_API_KEY` via `wrangler secret put` or the Cloudflare dashboard before deploy.
- **KV:** `VINEXT_KV_CACHE` id is set in `wrangler.jsonc` (vinext data/ISR cache). Custom domain: `cedears.com` via Workers Custom Domains.
- **Observability:** `wrangler.jsonc` enables Workers Logs (100%) and traces (10%).
- `pnpm lint` currently fails: the script is `eslint .` but `eslint` and an ESLint config are not part of the repo dependencies. This is the repo's shipped state, not a broken environment setup. Do not add ESLint unless the task asks for it.
- `next.config.mjs` sets `typescript.ignoreBuildErrors: true` and `serverExternalPackages: ['yahoo-finance2']`. Type errors do not fail the build.
- `pnpm install` may log ignored build scripts for `esbuild`, `workerd`, `sharp`, or `msw`. These are listed in `package.json` under `pnpm.onlyBuiltDependencies` and are expected; they are needed for vinext and Cloudflare builds.

## Design system

Visual identity for UI work lives in [`DESIGN.md`](./DESIGN.md) ([design.md](https://github.com/google-labs-code/design.md) format) and the Untitled Graphical theme in [`GUI.md`](./GUI.md) / [`gui/`](./gui/). Tokens in `app/globals.css` and DESIGN.md YAML front matter are normative. Keep new screens aligned with the shell (`max-w-5xl`, Timeless Grotesk + sans-serif fallback, shadcn `base-nova` mapped to Untitled). Timeless Grotesk WOFF2 files (400/500/600) live in `public/fonts/timeless/` with `@font-face` in `app/globals.css`; see that folder’s `LICENSE.pdf`.

## Graphical UI (Untitled)

For UI work, follow [`GUI.md`](./GUI.md) and use the skills `graphical-ui`, `graphical-convert`, or `graphical-audit` under `.agents/skills/` as appropriate. Theme values and component assignments live in [`gui/`](./gui/). The app has been converted to Untitled; prefer those tokens and shared `components/ui` treatments for new UI.
