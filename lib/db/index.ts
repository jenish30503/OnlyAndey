
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'

const globalDb = globalThis as unknown as { sqlite?: Database.Database }
export const sqlite = globalDb.sqlite ?? new Database('local.db')
if (process.env.NODE_ENV !== 'production') globalDb.sqlite = sqlite
export const db = drizzle(sqlite, { schema })
