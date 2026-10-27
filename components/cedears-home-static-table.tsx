import type { ReactNode } from 'react'
import Link from 'next/link'
import type { Cedear } from '@/lib/cedears'
import {
  cedearPctChangeClassName,
  formatCedearPctChange,
  formatCedearPrice,
} from '@/lib/cedear-table-format'
import { logoUrl } from '@/lib/logo'

export function CedearsHomeStaticTable({
  rows,
  caption,
}: {
  rows: Cedear[]
  caption?: ReactNode
}) {
  return (
    <div className="ch-wrap" id="cedears-home-static-table">
      {caption ? <p className="ch-cap">{caption}</p> : null}
      <table className="ch-table">
        <thead>
          <tr>
            <th className="ch-th ch-th-pin">
              <span className="sr-only">Fijar</span>
            </th>
            <th className="ch-th">Ticker</th>
            <th className="ch-th">Empresa</th>
            <th className="ch-th">Mercado</th>
            <th className="ch-th ch-th-r">Precio</th>
            <th className="ch-th ch-th-r">Var. %</th>
            <th className="ch-th ch-th-r">Ratio</th>
            <th className="ch-th ch-th-r">Ticker original</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => (
            <tr key={c.Cedears} aria-label={`Ver detalle de ${c.Cedears}`}>
              <td className="ch-td ch-td-pin" />
              <td className="ch-td">
                <img
                  src={logoUrl(c.TickerOriginal)}
                  alt=""
                  width={16}
                  height={16}
                  className="ch-logo"
                  loading="lazy"
                />
                <Link href={`/cedear/${c.Cedears}`} className="ch-ticker">
                  {c.Cedears}
                </Link>
              </td>
              <td className="ch-td ch-td-emp">
                <span className="block truncate">{c.Name}</span>
              </td>
              <td className="ch-td">
                <span className="ch-badge">{c.Market}</span>
              </td>
              <td className="ch-td ch-td-r">{formatCedearPrice(c.price)}</td>
              <td className={`ch-td ch-td-r ${cedearPctChangeClassName(c.pctChange)}`}>
                {formatCedearPctChange(c.pctChange)}
              </td>
              <td className="ch-td ch-td-r">{c.Ratio}</td>
              <td className="ch-td ch-td-r text-muted-foreground">{c.TickerOriginal}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
