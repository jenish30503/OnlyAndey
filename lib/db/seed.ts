import { sqlite, db } from './index'
import { pricing } from './schema'
import { eq } from 'drizzle-orm'
import { OWNER_ID } from '../pricing'

async function seed() {
  sqlite.exec(
    `CREATE TABLE IF NOT EXISTS pricing (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      boiled TEXT NOT NULL,
      raw TEXT NOT NULL,
      version INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL
    )`
  )

  sqlite.exec(
    `CREATE TABLE IF NOT EXISTS egg_orders (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      created_at TEXT NOT NULL,
      boiled_quantity INTEGER NOT NULL,
      raw_quantity INTEGER NOT NULL,
      boiled_price REAL NOT NULL,
      raw_price REAL NOT NULL,
      boiled_subtotal REAL NOT NULL,
      raw_subtotal REAL NOT NULL,
      total REAL NOT NULL,
      room TEXT NOT NULL,
      phone TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'New',
      payment_status TEXT NOT NULL DEFAULT 'Pending'
    )`
  )

  const existing = await db.select().from(pricing).where(eq(pricing.id, 'store')).get()
  if (!existing) {
    await db.insert(pricing).values({
      id: 'store',
      userId: OWNER_ID,
      boiled: [12, 11, 10, 9, 9, 8],
      raw: [11, 10, 9, 9, 8, 7],
      version: 1,
    })
    console.log('Seeded initial pricing.')
  } else {
    console.log('Pricing already exists.')
  }
}

seed().catch(console.error)
