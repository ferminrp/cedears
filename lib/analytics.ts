export const SEARCH_TICKER_DEBOUNCE_MS = 400

type SearchTickerParams = {
  query_len: number
}

type SelectTickerParams = {
  ticker: string
}

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

function pushGtagCommand(...args: unknown[]) {
  if (typeof window === "undefined") return

  if (typeof window.gtag === "function") {
    window.gtag(...args)
    return
  }

  window.dataLayer ??= []
  window.dataLayer.push(arguments)
}

export function trackSearchTicker(params: SearchTickerParams) {
  pushGtagCommand("event", "search_ticker", params)
}

export function trackSelectTicker(params: SelectTickerParams) {
  pushGtagCommand("event", "select_ticker", params)
}
