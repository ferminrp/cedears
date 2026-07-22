import type { CedearBase } from "@/lib/merge-cedear-quotes"

export type CedearFaq = {
  question: string
  answer: string
}

export function buildCedearFaqs(cedear: CedearBase): CedearFaq[] {
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
      answer: `Podés ver el precio en vivo de ${cedear.Cedears} en esta página, en la sección «Cotización y datos», con variación diaria y cotizaciones en MEP y cable.`,
    },
    {
      question: `¿Cuánto vale la acción ${cedear.TickerOriginal} en dólares?`,
      answer: `El precio en dólares de ${cedear.TickerOriginal} (${cedear.Name}) en ${cedear.Market} se muestra en vivo en la sección de cotización de esta página.`,
    },
    {
      question: `¿Cuál es el precio teórico del CEDEAR ${cedear.Cedears} en dólares?`,
      answer: `El precio teórico del CEDEAR ${cedear.Cedears} se calcula dividiendo el precio de ${cedear.TickerOriginal} en USD por el ratio (${cedear.Ratio}:1). En la sección de cotización podés ver el valor actualizado.`,
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
