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

1. Create the KV namespace and update `wrangler.jsonc`:

   ```bash
   npx wrangler kv namespace create VINEXT_KV_CACHE
   ```

   Paste the returned id into `wrangler.jsonc` under `kv_namespaces`.

2. Set secrets (via `wrangler secret put` or the Cloudflare dashboard):

   - `FINNHUB_API_KEY`
   - `NEXT_PUBLIC_SITE_URL`

3. Deploy:

   ```bash
   pnpm run build:vinext
   pnpm run deploy:vinext
   ```

`wrangler.jsonc` enables `nodejs_compat` (required for `yahoo-finance2`). The migration is non-destructive: Next.js scripts (`pnpm dev`, `pnpm build`, `pnpm start`) continue to work.

## v0

This repository is linked to a [v0](https://v0.app) project for UI iteration. [Continue on v0 →](https://v0.app/chat/projects/prj_4Nr5oAlzxqijy9G4Pe2XcnPyeszv)
