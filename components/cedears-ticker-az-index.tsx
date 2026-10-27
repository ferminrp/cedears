import Link from 'next/link'
import type { TickerAzGroup } from '@/lib/home-page'

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
            <ul className="flex min-w-0 flex-wrap gap-x-2 gap-y-1 text-sm leading-snug">
              {tickers.map((ticker) => (
                <li key={ticker} className="min-w-0">
                  <Link
                    href={`/cedear/${ticker}`}
                    className="font-mono text-foreground underline-offset-4 hover:underline"
                  >
                    {ticker}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
