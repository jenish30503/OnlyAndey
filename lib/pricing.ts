export type EggType = 'boiled' | 'raw'
export type Quantities = Record<EggType, number>
export type Pricing = { boiled: number[]; raw: number[]; version: number }
export const TIER_LABELS = ['1', '2', '3', '4', '5–9', '10+'] as const
export const OWNER_ID = 'only-andey-owner'
export const ORDER_STATUSES = ['New', 'Confirmed', 'Out for Delivery', 'Delivered', 'Cancelled'] as const
export const PAYMENT_STATUSES = ['Pending', 'Paid'] as const

export function tierIndex(quantity: number) {
  if (!Number.isSafeInteger(quantity) || quantity < 0) throw new Error('Enter a valid whole number of eggs.')
  return quantity >= 10 ? 5 : quantity >= 5 ? 4 : Math.max(0, quantity - 1)
}
export function pricePerEgg(quantity: number, tiers: number[]) {
  const price = tiers[tierIndex(quantity)]
  if (!Number.isFinite(price) || price <= 0) throw new Error('Pricing is unavailable.')
  return price
}
export function calculateOrder(quantities: Quantities, pricing: Pricing) {
  const boiledPrice = pricePerEgg(quantities.boiled, pricing.boiled)
  const rawPrice = pricePerEgg(quantities.raw, pricing.raw)
  const boiledCents = quantities.boiled * Math.round(boiledPrice * 100)
  const rawCents = quantities.raw * Math.round(rawPrice * 100)
  if (!Number.isSafeInteger(boiledCents + rawCents)) throw new Error('This quantity is too large to calculate accurately.')
  return { boiledPrice, rawPrice, boiledSubtotal: boiledCents / 100, rawSubtotal: rawCents / 100, total: (boiledCents + rawCents) / 100 }
}
export const money = (value: number | string) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(value)).replace('.00', '')
export type Receipt = ReturnType<typeof calculateOrder> & Quantities & { id: string; room: string; phone: string; createdAt: string }
