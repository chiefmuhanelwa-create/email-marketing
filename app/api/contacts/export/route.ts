import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { contacts } from '@/drizzle/schema'
import { eq, ilike, and, or, desc } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const q = searchParams.get('q') || ''
    const status = searchParams.get('status') || ''
    const source = searchParams.get('source') || ''

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

    const rows = await db.select().from(contacts)
      .where(where)
      .orderBy(desc(contacts.createdAt))
      .limit(50000)

    // Build CSV
    const headers = ['email', 'firstName', 'lastName', 'phone', 'status', 'source', 'tags', 'engagementScore', 'createdAt']
    const csvLines = [headers.join(',')]

    for (const row of rows) {
      const line = [
        row.email,
        row.firstName || '',
        row.lastName || '',
        row.phone || '',
        row.status,
        row.source || '',
        (row.tags as string[] || []).join('|'),
        row.engagementScore,
        row.createdAt.toISOString().split('T')[0],
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
      csvLines.push(line)
    }

    const csv = csvLines.join('\n')
    const date = new Date().toISOString().split('T')[0]

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="contacts-${date}.csv"`,
      },
    })
  } catch (error) {
    console.error('[CONTACTS EXPORT]', error)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}
