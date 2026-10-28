import type { TickerAzGroup } from '@/lib/home-page'

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function renderTickerLinks(tickers: string[]): string {
  return tickers
    .map(
      (ticker) =>
        `<a href="/cedear/${escapeHtml(ticker)}">${escapeHtml(ticker)}</a>`,
    )
    .join(' ')
}

export function CedearsTickerAzIndex({ groups }: { groups: TickerAzGroup[] }) {
  if (groups.length === 0) return null

  return (
    <section
      aria-labelledby="indice-az-titulo"
      className="rounded-[var(--radius-m)] border border-border bg-card p-4 sm:p-6"
    >
      <h2
        id="indice-az-titulo"
        className="text-base font-medium text-foreground"
      >
        Índice A–Z de CEDEARs
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Enlace directo a la ficha de cada ticker.
      </p>
      <div className="mt-4 flex flex-col gap-4">
        {groups.map(({ letter, tickers }) => (
          <div key={letter} className="min-w-0">
            <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {letter}
            </h3>
            <p
              className="ch-az-line"
              dangerouslySetInnerHTML={{
                __html: renderTickerLinks(tickers),
              }}
            />
          </div>
        ))}
      </div>
    </section>
  )
}
