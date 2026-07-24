const LOGO_DEV_TOKEN = "pk_aOjcq-uNRdm3AWE9VR3rIA"

export function logoDevUpstreamUrl(ticker: string): string {
  const encoded = encodeURIComponent(ticker.trim().toUpperCase())
  const params = new URLSearchParams({
    token: LOGO_DEV_TOKEN,
    format: "webp",
    retina: "true",
  })
  return `https://img.logo.dev/ticker/${encoded}?${params.toString()}`
}

const LOGO_PROXY_VERSION = "2"

export function logoUrl(ticker: string): string {
  const encoded = encodeURIComponent(ticker.trim().toUpperCase())
  return `/api/logo/${encoded}?v=${LOGO_PROXY_VERSION}`
}
