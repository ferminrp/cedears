import { Newspaper } from "lucide-react"
import type { CompanyNewsItem } from "@/lib/company-news"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "short",
  year: "numeric",
})

function formatNewsDate(datetime: number): string {
  return dateFormatter.format(new Date(datetime * 1000))
}

function truncateSummary(text: string, maxLength = 160): string {
  const trimmed = text.trim()
  if (trimmed.length <= maxLength) return trimmed
  return `${trimmed.slice(0, maxLength).trimEnd()}…`
}

function getItemKey(item: CompanyNewsItem): string {
  return `${item.id}-${item.url}-${item.datetime}`
}

export function CedearNews({
  items,
  tickerOriginal,
}: {
  items: CompanyNewsItem[]
  tickerOriginal: string
}) {
  return (
    <section aria-labelledby="cedear-news-heading" className="space-y-4">
      <h2
        id="cedear-news-heading"
        className="text-xl font-semibold tracking-tight"
      >
        Noticias
      </h2>

      {items.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Newspaper />
            </EmptyMedia>
            <EmptyTitle>Sin noticias</EmptyTitle>
            <EmptyDescription>
              No hay noticias recientes para {tickerOriginal}.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <div className="divide-y rounded-lg border bg-card">
            {items.map((item) => (
              <article key={getItemKey(item)} className="px-4 py-3">
                <div className="flex gap-3">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt=""
                      width={80}
                      height={56}
                      loading="lazy"
                      decoding="async"
                      className="h-14 w-20 shrink-0 rounded-md bg-muted object-cover"
                    />
                  ) : null}
                  <div className="min-w-0 flex-1 space-y-1">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium underline-offset-4 hover:text-foreground hover:underline"
                    >
                      {item.headline}
                    </a>
                    <p className="text-xs text-muted-foreground">
                      {item.source} · {formatNewsDate(item.datetime)}
                    </p>
                    {item.summary ? (
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {truncateSummary(item.summary)}
                      </p>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Noticias vía Finnhub</p>
        </>
      )}
    </section>
  )
}
