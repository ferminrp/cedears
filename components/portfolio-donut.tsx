"use client"

export type DonutSegment = {
  key: string
  label: string
  value: number
  color: string
}

const RADIUS = 42
const STROKE = 14
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export function PortfolioDonut({
  segments,
  centerLabel,
  centerValue,
  emptyMessage = "Ingresá datos para ver la composición.",
  ariaLabel,
}: {
  segments: DonutSegment[]
  centerLabel?: string
  centerValue?: string
  emptyMessage?: string
  ariaLabel: string
}) {
  const total = segments.reduce((acc, s) => acc + Math.max(s.value, 0), 0)

  if (total <= 0) {
    return (
      <div className="flex aspect-square w-full max-w-56 items-center justify-center rounded-full border border-dashed text-center">
        <p className="max-w-36 text-xs text-muted-foreground text-pretty">
          {emptyMessage}
        </p>
      </div>
    )
  }

  let offset = 0

  return (
    <svg
      viewBox="0 0 100 100"
      className="w-full max-w-56"
      role="img"
      aria-label={ariaLabel}
    >
      <circle
        cx="50"
        cy="50"
        r={RADIUS}
        fill="none"
        className="stroke-muted"
        strokeWidth={STROKE}
      />
      {segments.map((segment) => {
        const value = Math.max(segment.value, 0)
        if (value <= 0) return null
        const fraction = value / total
        const dash = fraction * CIRCUMFERENCE
        const circle = (
          <circle
            key={segment.key}
            cx="50"
            cy="50"
            r={RADIUS}
            fill="none"
            stroke={segment.color}
            strokeWidth={STROKE}
            strokeDasharray={`${dash} ${CIRCUMFERENCE - dash}`}
            strokeDashoffset={-offset}
            transform="rotate(-90 50 50)"
          >
            <title>{`${segment.label}: ${(fraction * 100).toFixed(1)}%`}</title>
          </circle>
        )
        offset += dash
        return circle
      })}
      {(centerValue || centerLabel) && (
        <>
          {centerLabel && (
            <text
              x="50"
              y="45"
              textAnchor="middle"
              className="fill-muted-foreground"
              style={{ fontSize: "6px" }}
            >
              {centerLabel}
            </text>
          )}
          {centerValue && (
            <text
              x="50"
              y="56"
              textAnchor="middle"
              className="fill-foreground font-semibold"
              style={{ fontSize: "8px" }}
            >
              {centerValue}
            </text>
          )}
        </>
      )}
    </svg>
  )
}
