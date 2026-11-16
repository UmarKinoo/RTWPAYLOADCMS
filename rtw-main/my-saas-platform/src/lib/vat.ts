/** Saudi VAT rate applied on top of exclusive plan prices. */
export const VAT_RATE = 0.15

/** Round to 2 decimal places (SAR). */
export function roundMoney(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100
}

/** VAT amount for an exclusive price. */
export function vatAmount(exclusive: number, rate: number = VAT_RATE): number {
  return roundMoney(Number(exclusive) * rate)
}

/** Exclusive price + VAT. */
export function withVat(exclusive: number, rate: number = VAT_RATE): number {
  return roundMoney(Number(exclusive) + vatAmount(exclusive, rate))
}

export type PriceBreakdown = {
  exclusive: number
  vat: number
  total: number
  rate: number
}

export function priceBreakdown(exclusive: number, rate: number = VAT_RATE): PriceBreakdown {
  const base = roundMoney(Number(exclusive))
  const vat = vatAmount(base, rate)
  return {
    exclusive: base,
    vat,
    total: roundMoney(base + vat),
    rate,
  }
}
