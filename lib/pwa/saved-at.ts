/**
 * "Precios guardados {día} a las {HH:MM}" for the offline banner.
 * `fetchedAt` must be a real network fetch time recorded by the service worker
 * (or the page load itself); callers omit the line when it is unknown.
 */

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

export function formatSavedAt(
  fetchedAt: number,
  now: number,
  timeZone?: string,
): string {
  const fetched = new Date(fetchedAt)
  const time = new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
  }).format(fetched)

  // Compare calendar days in the requested zone.
  const toZoned = (d: Date) =>
    timeZone
      ? new Date(d.toLocaleString("en-US", { timeZone }))
      : d
  const zonedFetched = toZoned(fetched)
  const zonedNow = toZoned(new Date(now))
  const zonedYesterday = new Date(zonedNow)
  zonedYesterday.setDate(zonedYesterday.getDate() - 1)

  let day: string
  if (dayKey(zonedFetched) === dayKey(zonedNow)) {
    day = "hoy"
  } else if (dayKey(zonedFetched) === dayKey(zonedYesterday)) {
    day = "ayer"
  } else {
    day = `el ${new Intl.DateTimeFormat("es-AR", {
      day: "numeric",
      month: "numeric",
      timeZone,
    }).format(fetched)}`
  }

  return `Precios guardados ${day} a las ${time}`
}
