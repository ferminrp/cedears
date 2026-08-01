import { AlycLogo } from "@/components/alyc-logo"
import { footerLinkClassName } from "@/components/site-footer"
import { formatCommissionPercent, type Alyc } from "@/lib/alycs"

export function AlycsList({ alycs }: { alycs: Alyc[] }) {
  return (
    <ul className="divide-y divide-border/60">
      {alycs.map((alyc) => (
        <li key={alyc.id} className="py-4">
          <div className="flex items-start gap-3">
            <AlycLogo name={alyc.name} domain={alyc.domain} />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium leading-tight">{alyc.name}</p>
                <p className="shrink-0 font-mono text-lg tabular-nums">
                  {formatCommissionPercent(alyc.standardCommission)}
                </p>
              </div>

              {alyc.tiers.length > 0 ? (
                <ul className="space-y-1 text-xs text-muted-foreground">
                  {alyc.tiers.map((tier) => (
                    <li key={`${alyc.id}-${tier.name}`}>
                      {tier.name}
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
        </li>
      ))}
    </ul>
  )
}
