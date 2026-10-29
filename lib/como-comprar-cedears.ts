import type { CedearFaq } from "@/lib/cedear-faqs"

export function formatGuideUpdatedDate(isoDate: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date(isoDate))
}

export const COMO_COMPRAR_PAGE_TITLE = "Cómo comprar CEDEARs en Argentina"

export const COMO_COMPRAR_PAGE_H1 = "Cómo comprar CEDEARs en Argentina"

export const COMO_COMPRAR_META_DESCRIPTION =
  "Guía paso a paso para principiantes: qué es un CEDEAR, cómo leer el ratio, abrir cuenta en una ALyC, costos, impuestos y dividendos en Argentina."

export const COMO_COMPRAR_KEYWORDS = [
  "cómo comprar cedears",
  "donde comprar cedears",
  "cedears para principiantes",
  "comprar cedears argentina",
  "invertir en cedears",
] as const

export const COMO_COMPRAR_INTRO =
  "Esta guía explica cómo invertir en acciones extranjeras vía CEDEARs en BYMA, sin recomendar un broker en particular. Si recién empezás, leé qué son, cómo funciona el ratio y qué pasos seguir antes de tu primera orden."

export const QUE_ES_CEDEAR = [
  "Un CEDEAR (Certificado de Depósito Argentino) es un título que representa acciones u otros activos cotizados en el exterior. Se negocia en pesos argentinos en la Bolsa de Comercio de Buenos Aires (BYMA), como cualquier acción local.",
  "No comprás la acción en Nasdaq o NYSE directamente: comprás certificados depositados en custodia local. El precio en ARS refleja la cotización internacional, el tipo de cambio implícito y la oferta y demanda local.",
  "Cada CEDEAR tiene un ticker propio (por ejemplo AAPL en Argentina para Apple) y un ratio de conversión respecto al activo subyacente.",
] as const

export const RATIO_SECTION = {
  title: "Ratio de conversión: cómo leerlo",
  paragraphs: [
    "El ratio indica cuántos CEDEARs equivalen a una acción del mercado de origen. Un ratio 10:1 significa que diez CEDEARs representan una acción completa; un ratio 1:1 implica un certificado por acción.",
    "El ratio afecta el precio unitario en pesos: a igual valor de la acción en USD, un ratio más alto implica un CEDEAR más barato en ARS, pero no cambia la exposición económica si comprás la cantidad equivalente.",
    "Antes de operar, consultá el ratio vigente del ticker que te interesa. En este sitio tenés la tabla completa y una calculadora CEDEARs ↔ acciones.",
  ] as const,
}

export type HowToStep = {
  name: string
  text: string
}

export const COMO_COMPRAR_STEPS: HowToStep[] = [
  {
    name: "Elegí una ALyC regulada",
    text: "Operá solo a través de un Agente de Liquidación y Compensación (ALyC) o broker autorizado por la Comisión Nacional de Valores (CNV). Compará comisiones, plataforma y atención; no hace falta tener cuenta en el exterior.",
  },
  {
    name: "Abrí tu cuenta comitente",
    text: "Completá el alta online o presencial: datos personales, declaración de perfil de inversor, documentación (DNI, CUIL/CUIT) y aceptación de términos. La ALyC valida identidad según normativa de mercado.",
  },
  {
    name: "Transferí fondos a la cuenta",
    text: "Ingresá pesos argentinos (o la moneda que acepte tu ALyC) mediante transferencia bancaria u otros medios habilitados. Verificá tiempos de acreditación y si hay costos por ingreso o retiro.",
  },
  {
    name: "Buscá el ticker del CEDEAR",
    text: "En la plataforma del broker, buscá el símbolo local (por ejemplo MELI, AAPL, SPY). Confirmá que sea el CEDEAR en BYMA y no otro instrumento. Podés cruzar tickers y ratios en el listado de este sitio.",
  },
  {
    name: "Enviá la orden de compra",
    text: "Elegí cantidad o monto, tipo de orden (mercado o límite) y revisá el preview con comisiones estimadas. Confirmá la operación en horario de mercado BYMA.",
  },
  {
    name: "Seguí tu tenencia",
    text: "Los CEDEARs quedan en tu cuenta comitente. Podés consultar precio, dividendos y documentación desde la ALyC o herramientas como el listado y fichas de cada CEDEAR en cedears.com.",
  },
]

export const COSTOS_SECTION = {
  title: "Costos, comisiones e impuestos (visión general)",
  paragraphs: [
    "Cada ALyC cobra comisiones por operación (compra y venta), custodia y, en algunos casos, transferencias o servicios adicionales. Los porcentajes varían según broker, monto y convenios; suelen publicarse en el tarifario oficial (+ IVA).",
    "En Argentina, las ganancias por tenencia o venta de CEDEARs pueden estar alcanzadas por Impuesto a las Ganancias según tu situación fiscal y plazos de tenencia. Las retenciones y el tratamiento de dividendos dependen del tipo de renta y normativa vigente.",
    "Puede aplicarse el impuesto PAIS o percepciones según el canal de fondeo y el tipo de cambio utilizado; las reglas cambian con el tiempo. Consultá siempre con un contador o la documentación oficial antes de operar.",
    "Este sitio no brinda asesoramiento impositivo ni legal. Los montos de comisión de tu operación los ves en el ticket de confirmación de tu ALyC.",
  ] as const,
}

export const DIVIDENDOS_SECTION = {
  title: "Dividendos en CEDEARs",
  paragraphs: [
    "Si el activo subyacente paga dividendos, como tenedor de CEDEARs podés recibir el equivalente en pesos, sujeto a retenciones y calendario del emisor. El monto por certificado depende del ratio y del dividendo declarado en el exterior.",
    "Las fechas ex-dividendo y de pago suelen publicarse en el calendario de tu broker o en fuentes de mercado. En cedears.com podés ver qué CEDEARs tienen yield y próximas fechas estimadas.",
  ] as const,
}

export const COMO_COMPRAR_FAQ: CedearFaq[] = [
  {
    question: "¿Dónde se compran los CEDEARs?",
    answer:
      "Se compran en Argentina a través de una ALyC o broker autorizado por la CNV, con cuenta comitente en pesos. Se operan en BYMA como acciones locales; no necesitás cuenta en un broker del exterior.",
  },
  {
    question: "¿Cuánto dinero necesito para empezar?",
    answer:
      "Depende del precio del CEDEAR y del mínimo que exija tu ALyC. Algunos certificados cotizan a pocos miles de pesos por unidad; otros requieren montos mayores. Revisá el precio del ticker y las comisiones mínimas del broker.",
  },
  {
    question: "¿Puedo comprar fracciones de CEDEAR?",
    answer:
      "En general operás cantidades enteras de CEDEARs (como acciones). Si el precio de un certificado es alto, podés elegir otro activo con ratio o precio unitario más accesible.",
  },
  {
    question: "¿Los CEDEARs son lo mismo que ADRs?",
    answer:
      "Son instrumentos similares en concepto (representación local de activos extranjeros), pero los CEDEARs son el esquema usado en Argentina bajo regulación local y custodia en BYMA.",
  },
  {
    question: "¿Necesito dólar MEP o cable para comprar CEDEARs?",
    answer:
      "No para la compra en sí: la operatoria habitual es en pesos en BYMA. El tipo de cambio implícito del CEDEAR puede relacionarse con MEP o CCL, pero la orden se cursa en ARS desde tu comitente.",
  },
  {
    question: "¿Esta guía recomienda un broker?",
    answer:
      "No. La elección de ALyC es personal. Compará tarifarios, plataforma y servicio. Este sitio ofrece datos de mercado y herramientas; no somos asesores financieros.",
  },
]

export const GUIDE_SECTION_HEADING_CLASS =
  "text-[length:var(--size-l)] leading-[var(--line-l)] font-semibold tracking-[var(--letter-spacing-l)]"

export const GUIDE_TOC_ITEMS = [
  { id: "resumen", label: "Resumen" },
  { id: "que-es-cedear", label: "¿Qué es un CEDEAR?" },
  { id: "ratio-cedear", label: "Ratio de conversión" },
  { id: "pasos-comprar", label: "Paso a paso" },
  { id: "costos-impuestos", label: "Costos e impuestos" },
  { id: "dividendos-cedears", label: "Dividendos" },
  { id: "preguntas-frecuentes", label: "Preguntas frecuentes" },
] as const

export const GUIDE_DATE_MODIFIED_ISO = "2026-10-29T12:00:00.000Z"

export const GUIDE_RESUMEN_ROWS = [
  { label: "Mercado", value: "BYMA (Argentina)" },
  { label: "Moneda de operación", value: "Pesos argentinos (ARS)" },
  { label: "Intermediario", value: "ALyC o broker autorizado por la CNV" },
  { label: "Cuenta", value: "Comitente en pesos" },
  { label: "Ratio", value: "Varía por ticker; consultá antes de operar" },
] as const

export const GUIDE_BODY_CLASS =
  "max-w-[65ch] text-base leading-relaxed text-foreground"

export const GUIDE_STEP_NUMBER_CLASS =
  "w-8 shrink-0 font-[family-name:var(--font-brand)] text-[length:var(--size-xxl)] font-semibold leading-none tabular-nums text-foreground"

export const GUIDE_CARD_CLASS =
  "rounded-[var(--radius-xl)] border border-border bg-card p-6 shadow-[var(--shadow-s)]"
