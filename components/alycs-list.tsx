import { AlycLogo } from "@/components/alyc-logo"
import { footerLinkClassName } from "@/components/site-footer"
import {
  formatCommissionPercent,
  formatMarketRightsPercent,
  type Alyc,
} from "@/lib/alycs"

export function AlycsList({ alycs }: { alycs: Alyc[] }) {
  return (
    <ul className="divide-y border-t border-border/60">
      {alycs.map((alyc) => (
        <li key={alyc.id} className="py-4 first:pt-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <AlycLogo name={alyc.name} domain={alyc.domain} />
              <div className="min-w-0 space-y-2">
                <p className="font-medium leading-tight">{alyc.name}</p>

                {alyc.tiers.length > 0 ? (
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {alyc.tiers.map((tier) => (
                      <li key={`${alyc.id}-${tier.name}`}>
                        <span className="font-medium text-foreground/80">
                          {tier.name}
                        </span>
                        {": "}
                        <span className="font-mono tabular-nums">
                          {formatCommissionPercent(tier.commission)}
                        </span>
                        {" — "}
                        {tier.condition}
                      </li>
                    ))}
                  </ul>
                ) : null}

                {alyc.notes.length > 0 ? (
                  <ul className="space-y-0.5 text-sm text-muted-foreground">
                    {alyc.notes.map((note) => (
                      <li key={`${alyc.id}-${note}`}>{note}</li>
                    ))}
                  </ul>
                ) : null}

                <a
                  href={alyc.tarifarioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={footerLinkClassName}
                >
                  Ver tarifario
                </a>
              </div>
            </div>

            <div className="shrink-0 text-left sm:text-right">
              <p className="font-mono text-lg tabular-nums">
                {formatCommissionPercent(alyc.standardCommission)}
              </p>
              {alyc.marketRightsPercent != null ? (
                <p className="text-sm text-muted-foreground">
                  {formatMarketRightsPercent(alyc.marketRightsPercent)}
                </p>
              ) : null}
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}
