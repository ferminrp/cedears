"use client"

import { useEffect, useRef, useState } from "react"
import {
  mergeCedearQuotes,
  type CedearQuote,
} from "@/lib/merge-cedear-quotes"
import type { CedearBase } from "@/lib/merge-cedear-quotes"
import type { Cedear } from "@/lib/cedears"

const POLL_INTERVAL_MS = 600_000

type QuotesResponse = {
  fetchedAt: string
  quotes: Record<string, CedearQuote>
}

export type { CedearQuote }

export function mergeCedearsWithQuotes(
  bases: CedearBase[],
  quotes: Record<string, CedearQuote> | null,
): Cedear[] {
  return mergeCedearQuotes(bases, quotes)
}

export function useCedearQuotes(): {
  quotes: Record<string, CedearQuote> | null
  loading: boolean
  error: string | null
  fetchedAt: string | null
} {
  const [quotes, setQuotes] = useState<Record<string, CedearQuote> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fetchedAt, setFetchedAt] = useState<string | null>(null)
  const lastFetchRef = useRef<number | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    let intervalId: ReturnType<typeof setInterval> | null = null
    let initialFetch = true

    async function fetchQuotes() {
      try {
        if (initialFetch) {
          setLoading(true)
        }

        const res = await fetch("/api/cedears/quotes", {
          signal: controller.signal,
        })

        if (!res.ok) {
          const body: { error?: string } = await res.json().catch(() => ({}))
          throw new Error(body.error ?? `HTTP ${res.status}`)
        }

        const data: QuotesResponse = await res.json()
        setQuotes(data.quotes)
        setFetchedAt(data.fetchedAt)
        lastFetchRef.current = Date.now()
        setError(null)
      } catch (err) {
        if (controller.signal.aborted) return
        setError(
          err instanceof Error ? err.message : "Error al cargar cotizaciones",
        )
      } finally {
        if (!controller.signal.aborted && initialFetch) {
          setLoading(false)
          initialFetch = false
        }
      }
    }

    function startPolling() {
      if (intervalId) clearInterval(intervalId)
      intervalId = setInterval(() => {
        if (!document.hidden) {
          void fetchQuotes()
        }
      }, POLL_INTERVAL_MS)
    }

    function onVisibilityChange() {
      if (document.hidden) {
        if (intervalId) {
          clearInterval(intervalId)
          intervalId = null
        }
        return
      }

      const lastFetch = lastFetchRef.current
      if (!lastFetch || Date.now() - lastFetch > POLL_INTERVAL_MS) {
        void fetchQuotes()
      }
      startPolling()
    }

    void fetchQuotes()
    startPolling()
    document.addEventListener("visibilitychange", onVisibilityChange)

    return () => {
      controller.abort()
      if (intervalId) clearInterval(intervalId)
      document.removeEventListener("visibilitychange", onVisibilityChange)
    }
  }, [])

  return { quotes, loading, error, fetchedAt }
}
