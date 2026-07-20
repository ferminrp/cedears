# AGENTS.md

## Cursor Cloud specific instructions

This is a single Next.js 16 (App Router, React 19, Turbopack, Tailwind CSS v4) frontend app named "cedears". It has no backend or database. The one page fetches a public JSON of Argentine CEDEARs from `raw.githubusercontent.com` (see `lib/cedears.ts`) and renders a searchable/filterable table with Markdown/CSV export. Rendering the data therefore requires outbound network access to GitHub; if that fetch fails the page shows an "Error al cargar los datos" alert instead of the table.

- Package manager is `pnpm` (see `pnpm-lock.yaml`). Standard scripts live in `package.json`.
- Dev server: `pnpm dev` (Next.js on http://localhost:3000). Build: `pnpm build`. Both work as-is.
- `pnpm lint` currently fails: the script is `eslint .` but `eslint` and an ESLint config are not part of the repo dependencies. This is the repo's shipped state, not a broken environment setup. Do not add ESLint unless the task asks for it.
- `next.config.mjs` sets `typescript.ignoreBuildErrors: true` and `images.unoptimized: true`, so type errors do not fail the build.
- `pnpm install` logs "Ignored build scripts: msw, sharp" — these are optional and not needed to run or build the app.
