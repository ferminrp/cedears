---
name: verify-cedears
description: Launch cedears locally, run HTTP smoke checks, and capture desktop/mobile screenshots. Use after UI or routing changes, before shipping Workers builds, or when proving the CEDEAR list and tools still work end to end.
---

# Verify cedears

CEDEARs Argentina is a vinext (Vite + React 19) site on **http://localhost:3000** by default. Verification drives the **web UI** and **public HTTP routes** (CSV/JSON/sitemap). It needs outbound network access to GitHub (`raw.githubusercontent.com`) for the live CEDEAR table; without it the home page shows **Error al cargar los datos** and UI table checks are limited.

## Launch

**Preferred (fast, for agents):**

```bash
pnpm install
pnpm dev -p "${VERIFY_PORT:-3010}" -H 127.0.0.1
```

Ready when `curl -sf "http://127.0.0.1:${VERIFY_PORT:-3010}/"` returns HTTP 200 and HTML containing `Listado de CEDEARs en Argentina`.

**Production-like (Workers / wrangler):**

```bash
pnpm install
pnpm build
pnpm start
```

Wrangler prints a local URL (often `http://127.0.0.1:8787`). Use that as `VERIFY_BASE_URL` for doctor and smoke.

**Isolation:** concurrent verify runs must not share a port. Set `VERIFY_PORT` (dev) or pass `--port` to the helper. Do not attach to a dev server the user already uses on 3000 unless they set `VERIFY_BASE_URL`.

**Teardown:** if you started the server yourself, stop that process by PID. Do not `pkill` by name. The helper script kills only the child it spawned.

## Doctor

Read-only gate before driving features:

```bash
VERIFY_BASE_URL="http://127.0.0.1:3010" node scripts/verify-cedears.mjs --base-url "$VERIFY_BASE_URL" --no-screenshots
```

Or run only the doctor phase manually:

1. `GET $VERIFY_BASE_URL/` → 200, title text in HTML.
2. `GET $VERIFY_BASE_URL/cedears.json` → 200 and a non-empty JSON array when GitHub data is reachable.
3. If home HTML contains `Error al cargar los datos`, stop and fix network or retry later; do not treat an empty table as success.

The full helper runs doctor internally before smoke.

## Drive

**One-shot harness (launch + doctor + smoke + screenshots):**

```bash
node scripts/verify-cedears.mjs --mode dev --port 3010 --artifact-dir /opt/cursor/artifacts/verify-cedears-run
```

Against an existing server:

```bash
VERIFY_BASE_URL=http://127.0.0.1:3000 node scripts/verify-cedears.mjs \
  --base-url "$VERIFY_BASE_URL" \
  --artifact-dir /opt/cursor/artifacts/verify-cedears-run
```

Workers mode (build + `pnpm start`):

```bash
node scripts/verify-cedears.mjs --mode workers --port 8787 --artifact-dir /opt/cursor/artifacts/verify-cedears-workers
```

**Feature recipes:** read [features/README.md](./features/README.md) and the linked feature file before interactive checks. Prefer Playwright (bundled via `playwright` devDependency) with ARIA roles:

- Search: `getByRole('searchbox', { name: 'Buscar CEDEARs' })`
- Market filter: `getByRole('combobox', { name: 'Filtrar por mercado' })`
- Cedear row link: `getByRole('link', { name: /Ver detalle de / })`
- Main nav: `getByRole('navigation', { name: 'Secciones' })`

**Unit tests (logic only, no browser):**

```bash
pnpm test
```

**Build check (no server):**

```bash
pnpm build
```

Do not use `pnpm lint` as a gate (eslint is not installed in this repo).

## Evidence

Default artifact directory: `.verify-artifacts/<run-id>/` or pass `--artifact-dir`.

| Artifact | Proves |
| --- | --- |
| `doctor.txt` | Instance healthy, JSON feed reachable |
| `smoke.json` | Key routes return expected status |
| `canonical-smoke.json` | Absolute `rel=canonical` in initial `<head>` for home, categorías, sample CEDEAR, tecnología — expected URLs use production origin `https://cedears.com` (+ path), not the local `VERIFY_BASE_URL` |
| `home-desktop.png` | Home renders on desktop |
| `home-mobile.png` | Home renders on mobile (iPhone 13 profile) |
| `home-search-desktop.png` | Search interaction filters the list (when data loaded) |
| `summary.json` | Run metadata and pass/fail |
| `server.log` | Dev/workers stdout when the helper launched the server |

Proof standards:

- Exercise user-visible paths (navigation, search), not internal imports.
- Capture action **and** resulting state (search screenshot after typing).
- For mutations (portfolio CSV, DCA inputs), re-read the UI after the action.
- Copy final artifacts under `/opt/cursor/artifacts/` for cloud-agent walkthroughs; cleanup must not delete them.

## Cleanup

After a manual launch, stop the dev or wrangler process you started (SIGTERM on its PID).

The helper script stops only its spawned child process **group** on exit (so orphaned vinext dev servers do not linger). It always exits with status 0 or 1. It does **not** remove `--artifact-dir`. Remove `.verify-artifacts/` only when you no longer need local proofs.

**Canonical smoke:** compares `<link rel="canonical">` to `https://cedears.com` + path (override with `VERIFY_CANONICAL_ORIGIN`). Local dev still serves production canonicals via wrangler `vars`; the harness does not expect the dev server origin in canonical tags.

## Helpers

| Command | Purpose |
| --- | --- |
| `node scripts/verify-cedears.mjs` | Full verify with optional launch |
| `node scripts/verify-cedears.mjs --help` | Flags and env vars |
| `pnpm test` | Node test runner for `lib/` tools |
| `pnpm build` | Production bundle (required before `pnpm start`) |

First Playwright run on a fresh machine:

```bash
pnpm exec playwright install chromium
```

## Maintenance

When routes, nav labels, or ARIA names change, update the matching file under [features/](./features/) and re-run this skill. For a full map audit, use `/maintain-verification-skill` from pstack.
