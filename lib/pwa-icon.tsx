import { ImageResponse } from 'next/og'

/**
 * App mark: black tile, three ascending bars (white, white, brand red #fc032d).
 * Geometry comes from the approved mockup's 64px tile; everything scales from it.
 *
 * - `rounded`: tile with rounded corners on a transparent canvas (`purpose: any`, favicon).
 * - `square`: full-bleed black, no transparency (Apple touch icon; iOS rounds it).
 * - `maskable`: full-bleed black with the bars inside the central 80% safe zone.
 *   The bar group spans 26.6% × 25% of the canvas from the centre (corner at
 *   ~36.5% radius), inside the 40% safe-zone circle, so it uses the same geometry.
 */
export type PwaIconVariant = 'rounded' | 'square' | 'maskable'

const MARK = {
  base: 64,
  radius: 15,
  barWidth: 8,
  barGap: 5,
  barRadius: 2,
  bottomPadding: 16,
  bars: [
    { height: 14, color: '#ffffff' },
    { height: 24, color: '#ffffff' },
    { height: 32, color: '#fc032d' },
  ],
} as const

export function PwaIconMark({
  size,
  variant,
}: {
  size: number
  variant: PwaIconVariant
}) {
  const s = (n: number) => Math.round((n / MARK.base) * size)

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        gap: s(MARK.barGap),
        paddingBottom: s(MARK.bottomPadding),
        background: '#000000',
        borderRadius: variant === 'rounded' ? s(MARK.radius) : 0,
      }}
    >
      {MARK.bars.map((bar, i) => (
        <div
          key={i}
          style={{
            width: s(MARK.barWidth),
            height: s(bar.height),
            borderRadius: Math.max(1, s(MARK.barRadius)),
            background: bar.color,
          }}
        />
      ))}
    </div>
  )
}

export function createPwaIcon(size: number, variant: PwaIconVariant = 'rounded') {
  return new ImageResponse(<PwaIconMark size={size} variant={variant} />, {
    width: size,
    height: size,
  })
}
