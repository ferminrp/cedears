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
- Workers Observability (logs + traces)

### Manual deploy

Set the Finnhub secret (once per account/worker), then deploy:

```bash
printf '%s' "$FINNHUB_API_KEY" | pnpm exec wrangler secret put FINNHUB_API_KEY
pnpm run deploy:vinext
```

Requires `wrangler login` or `CLOUDFLARE_API_TOKEN` (+ `CLOUDFLARE_ACCOUNT_ID`). The migration is non-destructive: Next.js scripts (`pnpm dev`, `pnpm build`, `pnpm start`) continue to work.

### Workers Builds (Git → Cloudflare)

vinext must build **before** `wrangler deploy`. The default Workers Builds deploy command (`npx wrangler deploy`) fails because the root `wrangler.jsonc` points at a Vite entry (`vinext/server/fetch-handler`) that only exists after `vinext build`.

In the Cloudflare dashboard: **Workers → cedears → Settings → Builds**, set:

| Setting | Value |
| --- | --- |
| Build command | `pnpm run cf:build` |
| Deploy command | `pnpm run cf:deploy` |
| Non-production branch deploy command | `pnpm run cf:preview` |

Optional build variable: `NEXT_PUBLIC_SITE_URL=https://cedears.com` (already baked into `cf:build`). After saving, retry the failed build or push a new commit.

## v0

This repository is linked to a [v0](https://v0.app) project for UI iteration. [Continue on v0 →](https://v0.app/chat/projects/prj_4Nr5oAlzxqijy9G4Pe2XcnPyeszv)
