import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { contacts } from '@/drizzle/schema'
import { eq, ilike, and, or, desc, sql } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const q = searchParams.get('q') || ''
    const status = searchParams.get('status') || ''
    const source = searchParams.get('source') || ''
    const page = Number(searchParams.get('page') || '1')
    const pageSize = Math.min(Number(searchParams.get('pageSize') || '50'), 200)
    const offset = (page - 1) * pageSize

    const conditions = []
    if (q) {
      conditions.push(or(
        ilike(contacts.email, `%${q}%`),
        ilike(contacts.firstName, `%${q}%`),
        ilike(contacts.lastName, `%${q}%`)
      ))
    }
    if (status) conditions.push(eq(contacts.status, status))
    if (source) conditions.push(eq(contacts.source, source))

    const where = conditions.length > 0 ? and(...conditions) : undefined

    const [rows, totalResult] = await Promise.all([
      db.select().from(contacts)
        .where(where)
        .orderBy(desc(contacts.createdAt))
        .limit(pageSize)
        .offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(contacts).where(where),
    ])

    return NextResponse.json({
      contacts: rows,
      total: Number(totalResult[0]?.count || 0),
      page,
      pageSize,
    })
  } catch (error) {
    console.error('[CONTACTS GET]', error)
    return NextResponse.json({ error: 'Failed to load contacts' }, { status: 500 })
  }
}
