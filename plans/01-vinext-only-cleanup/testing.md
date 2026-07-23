# Testing

Back: [overview.md](./overview.md)

## Per-phase bar

Each phase lists its own check. Do not start the next phase until that check passes and the commit is pushed.

## Full smoke (after phase 6, and again after phase 7 if run)

```bash
pnpm install
pnpm run cf:build
pnpm run start
```

Against the wrangler URL:

| Path | Expect |
|---|---|
| `/` | 200, table or data alert |
| `/portfolio` | 200 |
| `/earnings` | 200 |
| `/herramientas/dca` | 200 |
| `/herramientas/rebalanceo` | 200 |
| `/cedear/AAPL` (or a ticker that exists) | 200, logo img loads |
| `/cedears.csv` | 200, `text/csv` |
| `/cedears.md` | 200 |
| `/api/logo/AAPL` | 200, image |
| `/sitemap.xml` | 200, absolute `https://cedears.com` URLs when env/var set |

No automated test suite exists. Do not add one in this plan.

`pnpm lint` will still fail (no eslint). Ignore.

## Control surface

Browser / `curl` against local wrangler. Use `control-ui` only if a visual regression is suspected (none expected in this plan).
