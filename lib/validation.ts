import { z } from 'zod'
import { ORDER_STATUSES, PAYMENT_STATUSES } from './pricing'

export const orderInput = z.object({
  id: z.uuid(),
  boiled: z.number().int().nonnegative(), raw: z.number().int().nonnegative(),
  version: z.number().int().positive(),
  room: z.string().trim().min(1, 'Enter your room number.').max(40).regex(/^[\p{L}\p{N}\s/#.-]+$/u, 'Enter a valid room number.'),
  phone: z.string().trim().transform(v => v.replace(/[\s()-]/g, '')).refine(v => /^(?:\+91)?[6-9]\d{9}$/.test(v), 'Enter a valid 10-digit Indian phone number.'),
}).refine(v => v.boiled + v.raw > 0, 'Tap an egg to start your order.')
export const pricingInput = z.object({
  boiled: z.array(z.number().positive().max(10000).multipleOf(0.01)).length(6),
  raw: z.array(z.number().positive().max(10000).multipleOf(0.01)).length(6),
  version: z.number().int().positive(),
})
export const updateOrderInput = z.object({ id: z.uuid(), status: z.enum(ORDER_STATUSES), paymentStatus: z.enum(PAYMENT_STATUSES) })
