export async function tryLoad<T>(load: () => Promise<T>): Promise<T | null> {
  try {
    return await load()
  } catch {
    return null
  }
}
