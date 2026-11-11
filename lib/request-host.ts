/** Hostname for the incoming request (first value when forwarded lists are present). */
export function requestHost(headers: Headers, url: URL): string {
  return (
    headers.get("x-forwarded-host") ??
    headers.get("host") ??
    url.host
  )
    .split(",")[0]
    .trim()
}
