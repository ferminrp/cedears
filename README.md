# cedears

Searchable CEDEARs table built with Next.js 16. The repo also supports a **vinext** (Vite) runtime for Cloudflare Workers deployment alongside the existing Next.js workflow.

## Getting started

Install dependencies:

```bash
pnpm install
```

### Next.js (default)

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### vinext (Vite)

```bash
pnpm run dev:vinext
```

Open [http://localhost:3001](http://localhost:3001).

## Cloudflare deploy

`wrangler.jsonc` is configured for Workers with:

- Worker name `cedears`
- Custom domain `cedears.com`
- KV binding `VINEXT_KV_CACHE`
- `vars.NEXT_PUBLIC_SITE_URL=https://cedears.com`
- `nodejs_compat` (required for `yahoo-finance2`)

Set the Finnhub secret (once per account/worker), then deploy:

```bash
printf '%s' "$FINNHUB_API_KEY" | pnpm exec wrangler secret put FINNHUB_API_KEY
NEXT_PUBLIC_SITE_URL=https://cedears.com pnpm run build:vinext
pnpm run deploy:vinext
```

Requires `wrangler login` or `CLOUDFLARE_API_TOKEN` (+ `CLOUDFLARE_ACCOUNT_ID`). The migration is non-destructive: Next.js scripts (`pnpm dev`, `pnpm build`, `pnpm start`) continue to work.

## v0

This repository is linked to a [v0](https://v0.app) project for UI iteration. [Continue on v0 →](https://v0.app/chat/projects/prj_4Nr5oAlzxqijy9G4Pe2XcnPyeszv)
