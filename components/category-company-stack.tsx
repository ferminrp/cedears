import { logoUrl } from "@/lib/logo"

type CategoryCompanyStackProps = {
  previewTickers: string[]
  totalCount: number
}

export function CategoryCompanyStack({
  previewTickers,
  totalCount,
}: CategoryCompanyStackProps) {
  const remainingCount = Math.max(totalCount - previewTickers.length, 0)

  if (previewTickers.length === 0) {
    return (
      <span className="shrink-0 text-sm text-muted-foreground">
        {totalCount === 1 ? "1 empresa" : `${totalCount} empresas`}
      </span>
    )
  }

  return (
    <span className="flex shrink-0 items-center gap-2">
      <span className="flex items-center">
        {previewTickers.map((ticker, index) => (
          <img
            key={ticker}
            src={logoUrl(ticker)}
            alt=""
            width={24}
            height={24}
            className="size-6 rounded-full border-2 border-background bg-muted object-contain"
            style={{
              marginLeft: index === 0 ? 0 : "-0.5rem",
              zIndex: previewTickers.length - index,
            }}
            loading="lazy"
          />
        ))}
      </span>
      {remainingCount > 0 ? (
        <span className="text-sm text-muted-foreground tabular-nums">
          +{remainingCount}
        </span>
      ) : null}
    </span>
  )
}
