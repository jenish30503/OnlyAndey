import { db } from '@/lib/db'
import { pricing } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { getAdminSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getAdminSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const [config] = await db.select().from(pricing).where(eq(pricing.id, 'store'))
    if (!config) throw new Error('Pricing not found')
    
    return Response.json({
      boiled: config.boiled,
      raw: config.raw
    })
  } catch (error) {
    console.error('Error fetching pricing:', error)
    return Response.json({ error: 'Failed to fetch pricing' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  const session = await getAdminSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { boiled, raw } = await req.json()
    
    if (!Array.isArray(boiled) || !Array.isArray(raw) || boiled.length !== 6 || raw.length !== 6) {
      return Response.json({ error: 'Invalid pricing format' }, { status: 400 })
    }

    const [config] = await db.select().from(pricing).where(eq(pricing.id, 'store'))

    const [updated] = await db
      .update(pricing)
      .set({ 
        boiled, 
        raw, 
        version: config ? config.version + 1 : 1,
        updatedAt: new Date().toISOString()
      })
      .where(eq(pricing.id, 'store'))
      .returning()

    return Response.json({ success: true, pricing: updated })
  } catch (error) {
    console.error('Error updating pricing:', error)
    return Response.json({ error: 'Failed to update pricing' }, { status: 500 })
  }
}
