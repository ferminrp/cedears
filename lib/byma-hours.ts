const AR_TIMEZONE = "America/Argentina/Buenos_Aires"

/** BYMA continuous session (Merval), ART — excludes holidays. */
const SESSION_OPEN = { hour: 11, minute: 0 }
const SESSION_CLOSE = { hour: 17, minute: 0 }

function arParts(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: AR_TIMEZONE,
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  })
  const parts = formatter.formatToParts(date)
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? ""

  return {
    weekday: get("weekday"),
    hour: Number.parseInt(get("hour"), 10),
    minute: Number.parseInt(get("minute"), 10),
  }
}

/** True during BYMA regular cash session (Mon–Fri 11:00–17:00 ART). */
export function isBymaRegularSessionOpen(at: Date = new Date()): boolean {
  const { weekday, hour, minute } = arParts(at)
  if (weekday === "Sat" || weekday === "Sun") return false

  const minutes = hour * 60 + minute
  const openMinutes = SESSION_OPEN.hour * 60 + SESSION_OPEN.minute
  const closeMinutes = SESSION_CLOSE.hour * 60 + SESSION_CLOSE.minute
  return minutes >= openMinutes && minutes < closeMinutes
}
