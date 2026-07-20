import {
  type Cedear,
  fairUsdPrice,
  formatArs,
  formatPct,
  formatUsd,
} from "@/lib/cedears"

export type CedearFaq = {
  question: string
  answer: string
}

export function buildCedearFaqs(cedear: Cedear): CedearFaq[] {
  const fairUsd = fairUsdPrice(cedear)
  const priceText =
    cedear.price !== null ? formatArs(cedear.price) : "sin cotización disponible"
  const usPriceText =
    cedear.usPrice !== null
      ? formatUsd(cedear.usPrice)
      : "sin cotización disponible"
  const fairUsdText =
    fairUsd !== null ? formatUsd(fairUsd) : "sin datos suficientes"
  const pctText =
    cedear.pctChange !== null ? formatPct(cedear.pctChange) : "sin variación disponible"

  return [
    {
      question: `¿Existe CEDEAR de ${cedear.TickerOriginal} en Argentina?`,
      answer: `Sí, existe el CEDEAR de ${cedear.TickerOriginal} (${cedear.Name}) en la Bolsa de Comercio de Buenos Aires (BYMA). Su ticker local es ${cedear.Cedears}.`,
    },
    {
      question: `¿Cuál es el ticker del CEDEAR de ${cedear.Name}?`,
      answer: `El ticker del CEDEAR de ${cedear.Name} en Argentina es ${cedear.Cedears}. La acción subyacente cotiza en ${cedear.Market} con el símbolo ${cedear.TickerOriginal}.`,
    },
    {
      question: `¿Cuál es el ratio del CEDEAR ${cedear.Cedears}?`,
      answer: `El CEDEAR ${cedear.Cedears} tiene un ratio de ${cedear.Ratio}:1. Eso significa que ${cedear.Ratio} CEDEARs equivalen a 1 acción de ${cedear.TickerOriginal}.`,
    },
    {
      question: `¿Cuánto vale el CEDEAR ${cedear.Cedears} hoy?`,
      answer: `El CEDEAR ${cedear.Cedears} cotiza hoy a ${priceText} en pesos argentinos, con una variación diaria de ${pctText}.`,
    },
    {
      question: `¿Cuánto vale la acción ${cedear.TickerOriginal} en dólares?`,
      answer: `La acción subyacente ${cedear.TickerOriginal} (${cedear.Name}) cotiza a ${usPriceText} en su mercado de origen (${cedear.Market}).`,
    },
    {
      question: `¿Cuál es el precio teórico del CEDEAR ${cedear.Cedears} en dólares?`,
      answer: `El precio teórico del CEDEAR ${cedear.Cedears} se calcula dividiendo el precio de ${cedear.TickerOriginal} por el ratio (${cedear.Ratio}). Hoy resulta en ${fairUsdText}.`,
    },
    {
      question: `¿Cómo se opera el CEDEAR ${cedear.Cedears} en dólares?`,
      answer: `En BYMA podés operar ${cedear.Cedears} en pesos, ${cedear.Cedears}D en dólar MEP y ${cedear.Cedears}C en dólar cable. Cada modalidad refleja un tipo de cambio distinto.`,
    },
    {
      question: `¿Dónde puedo ver el histórico del CEDEAR ${cedear.Cedears}?`,
      answer: `En esta página encontrás un gráfico con el precio histórico del CEDEAR ${cedear.Cedears} en pesos argentinos, con datos de data912.`,
    },
  ]
}
