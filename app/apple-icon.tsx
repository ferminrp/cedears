import { ImageResponse } from 'next/og'
import { PwaIconMark } from '@/lib/pwa-icon'

export const size = {
  width: 180,
  height: 180,
}

export const contentType = 'image/png'

// Full-bleed square with no transparency: iOS applies its own corner mask.
export default function AppleIcon() {
  return new ImageResponse(<PwaIconMark size={size.width} variant="square" />, {
    ...size,
  })
}
