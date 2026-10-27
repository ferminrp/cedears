'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { CedearsList } from '@/components/cedears-list'
import type { Cedear } from '@/lib/cedears'
import { HOME_TABLE_LIMIT } from '@/lib/home-page'

type CedearsHomeInteractiveProps = {
  tableCaption?: ReactNode
}

function hideStaticHomeBlock() {
  document.getElementById('cedears-home-static-block')?.setAttribute('hidden', 'hidden')
}

export function CedearsHomeInteractive({ tableCaption }: CedearsHomeInteractiveProps) {
  const [cedears, setCedears] = useState<Cedear[] | null>(null)
  const [loadError, setLoadError] = useState(false)
  const loadStarted = useRef(false)

  const loadCedears = useCallback(() => {
    if (loadStarted.current) return
    loadStarted.current = true

    void fetch('/cedears.json')
      .then((res) => {
        if (!res.ok) throw new Error(`cedears.json ${res.status}`)
        return res.json() as Promise<Cedear[]>
      })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setCedears(data)
          hideStaticHomeBlock()
        } else {
          setLoadError(true)
        }
      })
      .catch(() => {
        setLoadError(true)
      })
  }, [])

  useEffect(() => {
    if (cedears !== null) hideStaticHomeBlock()
  }, [cedears])

  if (loadError) {
    return null
  }

  return (
    <CedearsList
      cedears={cedears ?? []}
      tableCaption={cedears ? tableCaption : undefined}
      loadJsonOnInteraction={cedears === null ? loadCedears : undefined}
      toolbarOnlyUntilData={cedears === null}
      previewRowLimit={HOME_TABLE_LIMIT}
    />
  )
}
