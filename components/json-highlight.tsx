const TOKEN =
  /("(?:\\.|[^"\\])*")(\s*:)?|\b(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\b|\b(true|false|null)\b/g

/** Minimal JSON syntax colouring; no dependency. Keys blue, strings success green, numbers amber. */
export function JsonHighlight({
  value,
  surface = "default",
}: {
  value: unknown
  /** Light `#fbfbfc` code wells stay readable under `prefers-color-scheme: dark`. */
  surface?: "default" | "light"
}) {
  const stringClass =
    surface === "light" ? "text-[#007a5c]" : "text-success"
  const literalClass =
    surface === "light" ? "text-[#6a7075]" : "text-muted-foreground"
  const text = JSON.stringify(value, null, 2)
  const parts: React.ReactNode[] = []
  let last = 0
  let i = 0
  for (const m of text.matchAll(TOKEN)) {
    const start = m.index ?? 0
    if (start > last) parts.push(text.slice(last, start))
    if (m[1] && m[2]) {
      parts.push(<span key={i++} className="text-[#1f4fbf]">{m[1]}</span>, m[2])
    } else if (m[1]) {
      parts.push(<span key={i++} className={stringClass}>{m[1]}</span>)
    } else if (m[3]) {
      parts.push(<span key={i++} className="text-[#9a4b00]">{m[3]}</span>)
    } else {
      parts.push(<span key={i++} className={literalClass}>{m[4]}</span>)
    }
    last = start + m[0].length
  }
  parts.push(text.slice(last))
  return <code translate="no">{parts}</code>
}
