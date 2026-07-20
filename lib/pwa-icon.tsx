import { ImageResponse } from 'next/og'

export function createPwaIcon(size: number) {
  const fontSize = Math.round(size * 0.64)
  const borderRadius = Math.round(size * 0.2)

  return new ImageResponse(
    (
      <div
        style={{
          fontSize,
          background: '#ffffff',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius,
        }}
      >
        📊
      </div>
    ),
    {
      width: size,
      height: size,
    },
  )
}
