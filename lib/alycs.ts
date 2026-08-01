export type AlycCommission =
  | { kind: "exact"; percent: number }
  | { kind: "upTo"; percent: number }

export type AlycTier = {
  name: string
  commission: AlycCommission
  condition: string
}

export type Alyc = {
  id: string
  name: string
  domain: string
  tarifarioUrl: string
  standardCommission: AlycCommission
  tiers: AlycTier[]
  notes: string[]
}

const percentFormatter = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function alycFaviconUrl(domain: string): string {
  return `https://s2.googleusercontent.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`
}

export function formatCommissionPercent(commission: AlycCommission): string {
  return `${percentFormatter.format(commission.percent)}%`
}

function commissionSortValue(commission: AlycCommission): number {
  return commission.percent
}

const alycsData = [
  {
    id: "iebmas",
    name: "IEB+",
    domain: "iebmas.com.ar",
    tarifarioUrl: "https://www.iebmas.com.ar/",
    standardCommission: { kind: "exact", percent: 0 },
    tiers: [],
    notes: ["Suscripción mensual de $5.000 + IVA"],
  },
  {
    id: "iol",
    name: "IOL invertironline",
    domain: "invertironline.com",
    tarifarioUrl: "https://www.invertironline.com/tarifas",
    standardCommission: { kind: "exact", percent: 0.5 },
    tiers: [
      {
        name: "Gold",
        commission: { kind: "exact", percent: 0.5 },
        condition: "Plan Gold",
      },
      {
        name: "Volumen intermedio",
        commission: { kind: "exact", percent: 0.3 },
        condition: "Volumen operado entre $7,5M y $50M",
      },
      {
        name: "Volumen alto",
        commission: { kind: "exact", percent: 0.1 },
        condition: "Volumen operado superior a $50M",
      },
    ],
    notes: [],
  },
  {
    id: "balanz",
    name: "Balanz",
    domain: "balanz.com",
    tarifarioUrl: "https://balanz.com/comisiones/",
    standardCommission: { kind: "upTo", percent: 0.5 },
    tiers: [],
    notes: ["Bonifica 50% en operaciones intradiarias"],
  },
  {
    id: "cocos",
    name: "Cocos Capital",
    domain: "cocos.capital",
    tarifarioUrl: "https://cocos.capital/tarifario",
    standardCommission: { kind: "exact", percent: 0.45 },
    tiers: [
      {
        name: "Web / app",
        commission: { kind: "exact", percent: 0.45 },
        condition: "Personas físicas por web o app",
      },
      {
        name: "Gold",
        commission: { kind: "exact", percent: 0 },
        condition: "Publican 0% de comisión (sin incluir el costo del plan)",
      },
      {
        name: "Pro",
        commission: { kind: "exact", percent: 0 },
        condition: "Publican 0% de comisión (sin incluir el costo del plan)",
      },
    ],
    notes: [],
  },
  {
    id: "bull-market",
    name: "Bull Market Brokers",
    domain: "bullmarketbrokers.com",
    tarifarioUrl:
      "https://help.bullmarketbrokers.com/wp-content/uploads/2025/03/Tarifario-Marzo-2025.pdf",
    standardCommission: { kind: "exact", percent: 0.5 },
    tiers: [
      {
        name: "Digital",
        commission: { kind: "exact", percent: 0.5 },
        condition: "Canal digital",
      },
      {
        name: "Active Trader",
        commission: { kind: "exact", percent: 0.25 },
        condition: "Plan Active Trader",
      },
      {
        name: "Active Trader Plus",
        commission: { kind: "exact", percent: 0.1 },
        condition: "Plan Active Trader Plus",
      },
    ],
    notes: ["Tarifario de marzo 2025"],
  },
  {
    id: "ppi",
    name: "Portfolio Personal Inversiones — PPI",
    domain: "portfoliopersonal.com",
    tarifarioUrl: "https://www.portfoliopersonal.com/Contenido/comisiones",
    standardCommission: { kind: "exact", percent: 0.6 },
    tiers: [
      {
        name: "Internet",
        commission: { kind: "exact", percent: 0.6 },
        condition: "Operaciones por internet",
      },
      {
        name: "Asistida",
        commission: { kind: "upTo", percent: 1.5 },
        condition: "Operaciones con asistencia",
      },
    ],
    notes: [],
  },
  {
    id: "eco-valores",
    name: "Eco Valores",
    domain: "ecovalores.com.ar",
    tarifarioUrl: "https://www.ecovalores.com.ar/tarifario.php",
    standardCommission: { kind: "exact", percent: 0.33 },
    tiers: [
      {
        name: "No asesoradas",
        commission: { kind: "exact", percent: 0.33 },
        condition: "Operaciones no asesoradas",
      },
      {
        name: "Club Millones",
        commission: { kind: "exact", percent: 0.25 },
        condition: "Plan Club Millones",
      },
      {
        name: "Club Millones + intradiario",
        commission: { kind: "exact", percent: 0.13 },
        condition: "Puede partir de este valor combinando club e intradiario",
      },
    ],
    notes: [],
  },
  {
    id: "rava",
    name: "Rava Bursátil",
    domain: "rava.com",
    tarifarioUrl: "https://www.rava.com/nuestros-servicios/aranceles",
    standardCommission: { kind: "upTo", percent: 0.8 },
    tiers: [],
    notes: [
      "Renta variable contado",
      "Trading diario: cobra el mayor de los dos lados",
    ],
  },
  {
    id: "allaria",
    name: "Allaria",
    domain: "allaria.com.ar",
    tarifarioUrl: "https://allaria.com.ar/doc/ArancelesComisiones.pdf",
    standardCommission: { kind: "upTo", percent: 0.5 },
    tiers: [
      {
        name: "Autogestionada",
        commission: { kind: "upTo", percent: 0.5 },
        condition: "Cuenta autogestionada (incluye acciones)",
      },
    ],
    notes: ["Posibles bonificaciones por volumen"],
  },
  {
    id: "sbs",
    name: "SBS Trading",
    domain: "gruposbs.com",
    tarifarioUrl:
      "https://www.gruposbs.com/documentos/arancaeles-trading-20261.pdf",
    standardCommission: { kind: "exact", percent: 0.7 },
    tiers: [
      {
        name: "Quicktrade directos",
        commission: { kind: "exact", percent: 0.7 },
        condition: "Operaciones directas por Quicktrade (mín. $50)",
      },
      {
        name: "Atención personalizada",
        commission: { kind: "upTo", percent: 1 },
        condition: "Operaciones con atención personalizada",
      },
    ],
    notes: [],
  },
  {
    id: "puente",
    name: "Puente",
    domain: "puentenet.com",
    tarifarioUrl:
      "https://www3.puentenet.com/repo/arch/tabla-aranceles-puente-2026.pdf",
    standardCommission: { kind: "upTo", percent: 0.5 },
    tiers: [
      {
        name: "Internet",
        commission: { kind: "upTo", percent: 0.5 },
        condition: "Operaciones por internet (acciones)",
      },
    ],
    notes: ["Mín. USD 10 + IVA", "Tarifario de enero 2024"],
  },
] as const satisfies readonly Alyc[]

export function getAlycs(): Alyc[] {
  return [...alycsData].sort((left, right) => {
    const byCommission =
      commissionSortValue(left.standardCommission) -
      commissionSortValue(right.standardCommission)

    if (byCommission !== 0) {
      return byCommission
    }

    return left.name.localeCompare(right.name, "es-AR")
  })
}
