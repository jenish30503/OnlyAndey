import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

export const pricing = sqliteTable('pricing', {
  id: text('id').primaryKey(), 
  userId: text('userId').notNull(),
  boiled: text('boiled', { mode: 'json' }).$type<number[]>().notNull(), 
  raw: text('raw', { mode: 'json' }).$type<number[]>().notNull(),
  version: integer('version').notNull().default(1), 
  updatedAt: text('updated_at').notNull().default(new Date().toISOString()),
})

export const orders = sqliteTable('egg_orders', {
  id: text('id').primaryKey(), 
  userId: text('userId').notNull(),
  createdAt: text('created_at').notNull().default(new Date().toISOString()),
  boiledQuantity: integer('boiled_quantity').notNull(), 
  rawQuantity: integer('raw_quantity').notNull(),
  boiledPrice: real('boiled_price').notNull(), 
  rawPrice: real('raw_price').notNull(),
  boiledSubtotal: real('boiled_subtotal').notNull(), 
  rawSubtotal: real('raw_subtotal').notNull(),
  total: real('total').notNull(), 
  room: text('room').notNull(), 
  phone: text('phone').notNull(),
  status: text('status').notNull().default('New'), 
  paymentStatus: text('payment_status').notNull().default('Pending'),
})

export type OrderRow = typeof orders.$inferSelect
