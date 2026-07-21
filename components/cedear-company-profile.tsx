"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import type { UnderlyingCompanyProfile } from "@/lib/underlying-profile"

function formatEmployees(value: number): string {
  return new Intl.NumberFormat("es-AR").format(value)
}

function ProfileContent({
  profile,
  compact = false,
}: {
  profile: UnderlyingCompanyProfile
  compact?: boolean
}) {
  return (
    <div className="space-y-4">
      {(profile.sector || profile.industry) && (
        <div className="flex flex-wrap gap-2">
          {profile.sector ? (
            <Badge variant="secondary">{profile.sector}</Badge>
          ) : null}
          {profile.industry ? (
            <Badge variant="outline">{profile.industry}</Badge>
          ) : null}
        </div>
      )}

      {profile.description ? (
        <p
          className={`text-sm leading-relaxed text-muted-foreground ${
            compact ? "line-clamp-4" : ""
          }`}
        >
          {profile.description}
        </p>
      ) : null}

      <dl className="grid gap-2 text-sm">
        {profile.country ? (
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">País</dt>
            <dd>{profile.country}</dd>
          </div>
        ) : null}
        {profile.employees !== null ? (
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Empleados</dt>
            <dd className="font-mono tabular-nums">
              {formatEmployees(profile.employees)}
            </dd>
          </div>
        ) : null}
        {profile.website ? (
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Sitio web</dt>
            <dd className="min-w-0 truncate text-right">
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-foreground underline underline-offset-4"
              >
                {profile.website.replace(/^https?:\/\/(www\.)?/, "")}
              </a>
            </dd>
          </div>
        ) : null}
      </dl>
    </div>
  )
}

export function CedearCompanyProfile({
  profile,
  compact = false,
  showHeading = true,
}: {
  profile: UnderlyingCompanyProfile
  compact?: boolean
  showHeading?: boolean
}) {
  return (
    <section aria-labelledby={showHeading ? "company-profile-heading" : undefined}>
      {showHeading ? (
        <h3
          id="company-profile-heading"
          className="text-xs font-medium tracking-wide text-muted-foreground uppercase"
        >
          Sobre {profile.ticker}
        </h3>
      ) : null}
      <div className={showHeading ? "mt-3" : undefined}>
        <ProfileContent profile={profile} compact={compact} />
      </div>
    </section>
  )
}

export function CedearCompanyProfileLoader({
  tickerOriginal,
  compact = false,
}: {
  tickerOriginal: string
  compact?: boolean
}) {
  const [profile, setProfile] = useState<UnderlyingCompanyProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    const normalized = tickerOriginal.trim().toUpperCase()

    setLoading(true)
    setProfile(null)

    fetch(`/api/underlying-profile/${encodeURIComponent(normalized)}`, {
      signal: controller.signal,
    })
      .then(async (res) => {
        if (res.status === 404) return null
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return (await res.json()) as UnderlyingCompanyProfile
      })
      .then((data) => {
        if (!controller.signal.aborted) {
          setProfile(data)
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted && error.name !== "AbortError") {
          console.error("No se pudo cargar el perfil de la empresa", error)
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      })

    return () => controller.abort()
  }, [tickerOriginal])

  if (loading) {
    return (
      <section aria-busy="true" aria-label="Cargando perfil de la empresa">
        <div className="space-y-3">
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          <div className="flex gap-2">
            <div className="h-6 w-24 animate-pulse rounded-full bg-muted" />
            <div className="h-6 w-32 animate-pulse rounded-full bg-muted" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-full animate-pulse rounded bg-muted" />
            <div className="h-3 w-full animate-pulse rounded bg-muted" />
            <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </section>
    )
  }

  if (!profile) return null

  return <CedearCompanyProfile profile={profile} compact={compact} />
}
