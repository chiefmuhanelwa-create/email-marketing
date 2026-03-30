import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { contacts, emailEvents } from '@/drizzle/schema'
import { eq, count, avg, sql } from 'drizzle-orm'

export async function GET() {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const [
      sourceBreakdown,
      statusBreakdown,
      engagementStats,
      openEvents,
      clickEvents,
      sentEvents,
    ] = await Promise.all([
      db.select({ source: contacts.source, count: count() }).from(contacts).groupBy(contacts.source),
      db.select({ status: contacts.status, count: count() }).from(contacts).groupBy(contacts.status),
      db.select({ avgScore: avg(contacts.engagementScore) }).from(contacts).where(eq(contacts.status, 'active')),
      db.select({ count: count() }).from(emailEvents).where(eq(emailEvents.eventType, 'opened')),
      db.select({ count: count() }).from(emailEvents).where(eq(emailEvents.eventType, 'clicked')),
      db.select({ count: count() }).from(emailEvents).where(eq(emailEvents.eventType, 'sent')),
    ])

    const growthData = await db.execute(sql`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM contacts
      WHERE created_at >= ${thirtyDaysAgo.toISOString()}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `)

    const growthMap = new Map<string, number>()
    for (const row of growthData.rows as any[]) {
      growthMap.set(String(row.date).split('T')[0], Number(row.count))
    }

    const growthByDay = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      const dateStr = d.toISOString().split('T')[0]
      growthByDay.push({ date: dateStr, count: growthMap.get(dateStr) || 0 })
    }

    return NextResponse.json({
      growthByDay,
      sourceBreakdown: sourceBreakdown.map(s => ({ source: s.source || 'unknown', count: Number(s.count) })),
      statusBreakdown: statusBreakdown.map(s => ({ status: s.status, count: Number(s.count) })),
      engagementStats: {
        avgScore: Number(engagementStats[0]?.avgScore || 0),
        opened: Number(openEvents[0]?.count || 0),
        clicked: Number(clickEvents[0]?.count || 0),
        sent: Number(sentEvents[0]?.count || 0),
      },
    })
  } catch (error) {
    console.error('[ANALYTICS]', error)
    return NextResponse.json({ error: 'Failed to load analytics' }, { status: 500 })
  }
}
