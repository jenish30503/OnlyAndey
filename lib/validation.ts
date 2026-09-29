import { z } from 'zod'
import { ORDER_STATUSES, PAYMENT_STATUSES } from './pricing'

export const orderInput = z.object({
  id: z.uuid(),
  boiled: z.number().int().nonnegative(), raw: z.number().int().nonnegative(),
  version: z.number().int().positive(),
  room: z.string().trim().regex(/^\d{3}$/, 'Room number must be exactly 3 digits.'),
  phone: z.string().trim().transform(v => v.replace(/[\s()-]/g, '')).refine(v => /^\d{10}$/.test(v), 'Phone number must be exactly 10 digits.'),
}).refine(v => v.boiled + v.raw > 0, 'Tap an egg to start your order.')
export const pricingInput = z.object({
  boiled: z.array(z.number().positive().max(10000).multipleOf(0.01)).length(6),
  raw: z.array(z.number().positive().max(10000).multipleOf(0.01)).length(6),
  version: z.number().int().positive(),
})
export const updateOrderInput = z.object({ id: z.uuid(), status: z.enum(ORDER_STATUSES), paymentStatus: z.enum(PAYMENT_STATUSES) })
