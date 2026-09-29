import { db } from '@/lib/db'
import { orders } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { getAdminSession } from '@/lib/auth'

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await context.params;
    const { status, paymentStatus } = await req.json()
    const updateData: any = {}
    
    if (status) updateData.status = status
    if (paymentStatus) updateData.paymentStatus = paymentStatus

    if (Object.keys(updateData).length === 0) {
      return Response.json({ error: 'No fields to update' }, { status: 400 })
    }

    const updated = db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, id))
      .returning()
      .get()

    if (!updated) {
      return Response.json({ error: 'Order not found' }, { status: 404 })
    }

    return Response.json({ success: true, order: updated })
  } catch (error) {
    console.error('Error updating order:', error)
    return Response.json({ error: 'Failed to update order' }, { status: 500 })
  }
}
