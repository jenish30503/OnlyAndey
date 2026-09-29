import { db } from '@/lib/db'
import { orders, pricing } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { calculateOrder, OWNER_ID } from '@/lib/pricing'
import { orderInput } from '@/lib/validation'

export async function POST(request: Request) {
  if (!request.headers.get('content-type')?.includes('application/json')) return Response.json({ error: 'Invalid request.' }, { status: 415 })
  if (Number(request.headers.get('content-length') ?? 0) > 4096) return Response.json({ error: 'Request too large.' }, { status: 413 })
  let body: unknown
  try { body = await request.json() } catch { return Response.json({ error: 'Please check your order and try again.' }, { status: 400 }) }
  const parsed = orderInput.safeParse(body)
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? 'Check your room and phone number.' }, { status: 400 })
  const input = parsed.data
  try {
    const result = await db.transaction(async tx => {
      const [config] = await tx.select().from(pricing).where(and(eq(pricing.id, 'store'), eq(pricing.userId, OWNER_ID)))
      if (!config) throw new Error('Pricing unavailable')
      const [existing] = await tx.select().from(orders).where(and(eq(orders.id, input.id), eq(orders.userId, OWNER_ID)))
      if (existing) {
        if (existing.room !== input.room || existing.phone !== input.phone || existing.boiledQuantity !== input.boiled || existing.rawQuantity !== input.raw) return { conflict: true as const }
        return { order: existing }
      }
      if (config.version !== input.version) return { changed: true as const }
      const totals = calculateOrder(input, config)
      const [order] = await tx.insert(orders).values({ id: input.id, userId: OWNER_ID, boiledQuantity: input.boiled, rawQuantity: input.raw, boiledPrice: totals.boiledPrice, rawPrice: totals.rawPrice, boiledSubtotal: totals.boiledSubtotal, rawSubtotal: totals.rawSubtotal, total: totals.total, room: input.room, phone: input.phone }).onConflictDoNothing().returning()
      if (!order) return { conflict: true as const }
      return { order }
    })
    if ('changed' in result) return Response.json({ error: 'Prices have just been updated. Review your total and place your order again.', code: 'PRICING_CHANGED' }, { status: 409 })
    if ('conflict' in result) return Response.json({ error: 'This order request has already been used. Please retry.' }, { status: 409 })
    const o = result.order
    return Response.json({ id: o.id, boiled: o.boiledQuantity, raw: o.rawQuantity, boiledPrice: Number(o.boiledPrice), rawPrice: Number(o.rawPrice), boiledSubtotal: Number(o.boiledSubtotal), rawSubtotal: Number(o.rawSubtotal), total: Number(o.total), room: o.room, phone: o.phone, createdAt: o.createdAt }, { status: 201, headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('Order submission failed', error)
    return Response.json({ error: 'We couldn’t confirm your order. Please try again; retrying won’t place it twice.' }, { status: 503 })
  }
}
