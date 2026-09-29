import { db } from '@/lib/db'
import { orders } from '@/lib/db/schema'
import { desc, and, eq } from 'drizzle-orm'
import { getAdminSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const session = await getAdminSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const statusFilter = searchParams.get('status')
  const paymentFilter = searchParams.get('payment')

  let conditions = []
  if (statusFilter && statusFilter !== 'All') conditions.push(eq(orders.status, statusFilter))
  if (paymentFilter && paymentFilter !== 'All') conditions.push(eq(orders.paymentStatus, paymentFilter))

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  try {
    let data;
    if (whereClause) {
      data = db.select().from(orders).where(whereClause).orderBy(desc(orders.createdAt)).all();
    } else {
      data = db.select().from(orders).orderBy(desc(orders.createdAt)).all();
    }

    // Simple stats calculation for 'today' (using a simplified definition for all records)
    const todayOrders = data.length
    const todayRevenue = data.reduce((sum, order) => sum + Number(order.total), 0)
    const pendingOrders = data.filter(o => o.status === 'New').length
    const deliveredOrders = data.filter(o => o.status === 'Delivered').length

    return Response.json({
      orders: data,
      stats: { todayOrders, todayRevenue, pendingOrders, deliveredOrders }
    })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return Response.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}
