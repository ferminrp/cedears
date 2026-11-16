/**
 * Simplified Workers Cache URL key (path + query only — no host).
 * @see https://developers.cloudflare.com/workers/cache/cache-keys/
 */
export function workersCacheUrlKey(request: Request): string {
  const url = new URL(request.url)
  return `${url.pathname}${url.search}`
}

/** Cache key when `ctx.props` partitions cached entrypoints (e.g. apex HTML). */
export function workersCacheKeyWithProps(
  request: Request,
  entrypoint: string,
  props: Record<string, string>,
): string {
  const propsKey = Object.keys(props)
    .sort()
    .map((k) => `${k}=${props[k]}`)
    .join("&")
  return `${entrypoint}|${workersCacheUrlKey(request)}|${propsKey}`
}
