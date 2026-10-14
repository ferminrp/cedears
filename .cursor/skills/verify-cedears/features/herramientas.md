# Tools (DCA and rebalance)

Herramientas hosts calculators for dollar-cost averaging and portfolio rebalancing.

## Sub-features

- `tools-index` — `/herramientas` links to sub-tools.
- `tools-dca` — DCA calculator form accepts ARS monthly amount.
- `tools-rebalance` — rebalance calculator loads with mode radio group.

## How to get to it (user POV)

- Nav **Herramientas** → `/herramientas`.
- Open **DCA** at `/herramientas/dca` or **Rebalanceo** at `/herramientas/rebalanceo`.

## Driving it with Playwright

Preconditions:

- Smoke routes for `/herramientas`, `/herramientas/dca`, `/herramientas/rebalanceo` return 200.

- **Index.** `page.goto(\`${VERIFY_BASE_URL}/herramientas\`)`. Links or cards lead to DCA and rebalance pages.
- **DCA.** On `/herramientas/dca`, `getByRole('textbox', { name: 'Monto mensual a invertir en ARS' })` is visible. Fill a sample amount (e.g. `100000`) and confirm results region updates without console errors.
- **Rebalance.** On `/herramientas/rebalanceo`, `getByRole('radiogroup', { name: 'Modo de rebalanceo' })` is present.
- **Proof.** Screenshots `herramientas-dca.png` and `herramientas-rebalanceo.png`.

## Gotchas

- Calculators depend on selected CEDEAR rows; add at least one ticker via the picker before expecting allocation output.
- Logic-heavy paths are also covered by `pnpm test` (`tests/tools.test.ts`); UI proof still matters for labels and layout.
