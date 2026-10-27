const priceFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

const pctFormatter = new Intl.NumberFormat('es-AR', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
  signDisplay: 'exceptZero',
})

export function formatCedearPrice(value: number | null): string {
  if (value === null) return '—'
  return priceFormatter.format(value)
}

export function formatCedearPctChange(value: number | null): string {
  if (value === null) return '—'
  return `${pctFormatter.format(value)}%`
}

export function cedearPctChangeClassName(value: number | null): string {
  if (value === null || value === 0) return 'text-muted-foreground'
  if (value > 0) return 'text-success'
  return 'text-destructive'
}
