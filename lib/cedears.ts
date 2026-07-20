export type Cedear = {
  Cedears: string
  Name: string
  Market: string
  Ratio: string
  TickerOriginal: string
}

const DATA_URL =
  "https://raw.githubusercontent.com/ferminrp/google-sheets-argento/refs/heads/main/data/cedears.json"

export async function getCedears(): Promise<Cedear[]> {
  const res = await fetch(DATA_URL, {
    // Revalidate once a day: the list of available CEDEARs changes rarely.
    next: { revalidate: 86400 },
  })

  if (!res.ok) {
    throw new Error(`No se pudo obtener la lista de CEDEARs (HTTP ${res.status})`)
  }

  const data = (await res.json()) as Cedear[]
  return data
}
