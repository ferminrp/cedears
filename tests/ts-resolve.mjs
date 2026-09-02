import { existsSync } from "node:fs"
import { dirname, extname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const TS_EXT = [".ts", ".tsx"]

function tryFile(base) {
  if (existsSync(base) && extname(base)) return base
  for (const ext of TS_EXT) {
    if (existsSync(base + ext)) return base + ext
  }
  if (existsSync(join(base, "index.ts"))) return join(base, "index.ts")
  return null
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const abs = tryFile(join("/workspace", specifier.slice(2)))
    if (abs) {
      return { url: pathToFileURL(abs).href, shortCircuit: true }
    }
  }

  if (
    (specifier.startsWith("./") || specifier.startsWith("../")) &&
    context.parentURL &&
    !extname(specifier)
  ) {
    const parent = dirname(fileURLToPath(context.parentURL))
    const abs = tryFile(join(parent, specifier))
    if (abs) {
      return { url: pathToFileURL(abs).href, shortCircuit: true }
    }
  }

  return nextResolve(specifier, context)
}
