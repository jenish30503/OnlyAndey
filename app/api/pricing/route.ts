import { db } from '@/lib/db'
import { pricing } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { OWNER_ID } from '@/lib/pricing'

export const dynamic = 'force-dynamic'
export async function GET() {
  try {
    const [row] = await db.select({ boiled: pricing.boiled, raw: pricing.raw, version: pricing.version }).from(pricing).where(and(eq(pricing.id, 'store'), eq(pricing.userId, OWNER_ID)))
    if (!row) throw new Error('Pricing row not found')
    return Response.json(row, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('Pricing lookup failed', error)
    return Response.json({ error: 'Prices are taking a little longer. Please try again.' }, { status: 503 })
  }
}
