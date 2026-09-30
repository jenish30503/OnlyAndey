import { db } from '@/lib/db'
import { shopSettings } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { getAdminSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const row = db.select().from(shopSettings).where(eq(shopSettings.id, 'store')).get()
    const isOpen = row ? row.isOpen === 1 : true // default open
    return Response.json({ isOpen }, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } })
  } catch {
    return Response.json({ isOpen: true }, { headers: { 'Cache-Control': 'no-store' } })
  }
}

export async function PATCH(req: Request) {
  const session = await getAdminSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { isOpen } = await req.json()
    if (typeof isOpen !== 'boolean') return Response.json({ error: 'Invalid value' }, { status: 400 })

    const existing = db.select().from(shopSettings).where(eq(shopSettings.id, 'store')).get()
    if (existing) {
      db.update(shopSettings)
        .set({ isOpen: isOpen ? 1 : 0, updatedAt: new Date().toISOString() })
        .where(eq(shopSettings.id, 'store'))
        .run()
    } else {
      db.insert(shopSettings)
        .values({ id: 'store', isOpen: isOpen ? 1 : 0, updatedAt: new Date().toISOString() })
        .run()
    }

    return Response.json({ isOpen }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('Error updating shop status:', error)
    return Response.json({ error: 'Failed to update' }, { status: 500 })
  }
}
