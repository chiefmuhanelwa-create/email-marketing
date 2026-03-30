import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from '@/drizzle/schema'

function getDb() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not set')
  const sql = neon(url)
  return drizzle(sql, { schema })
}

let _db: ReturnType<typeof getDb> | null = null

export function getDatabase() {
  if (!_db) _db = getDb()
  return _db
}

// Proxy so existing `import { db }` usage continues to work
export const db = new Proxy({} as ReturnType<typeof getDb>, {
  get(_target, prop) {
    return getDatabase()[prop as keyof ReturnType<typeof getDb>]
  },
})
