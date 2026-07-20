import { createPwaIcon } from '@/lib/pwa-icon'

export async function GET() {
  return createPwaIcon(512)
}
