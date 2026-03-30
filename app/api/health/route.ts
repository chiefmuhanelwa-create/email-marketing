import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { contacts, campaigns, revenueEvents, emailEvents, importBatches } from '@/drizzle/schema'
import { eq, gte, count, sum, and } from 'drizzle-orm'
import { sql } from 'drizzle-orm'

export async function GET() {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const [
      totalContactsResult,
      activeContactsResult,
      totalCampaignsResult,
      totalRevenueResult,
      recentImportsResult,
      openEventsResult,
      sentEventsResult,
    ] = await Promise.all([
      db.select({ count: count() }).from(contacts),
      db.select({ count: count() }).from(contacts).where(eq(contacts.status, 'active')),
      db.select({ count: count() }).from(campaigns).where(eq(campaigns.status, 'sent')),
      db.select({ total: sum(revenueEvents.amountZar) }).from(revenueEvents),
      db.select({ count: count() }).from(importBatches).where(gte(importBatches.createdAt, thirtyDaysAgo)),
      db.select({ count: count() }).from(emailEvents).where(eq(emailEvents.eventType, 'opened')),
      db.select({ count: count() }).from(emailEvents).where(eq(emailEvents.eventType, 'sent')),
    ])

    const totalSent = Number(sentEventsResult[0]?.count || 0)
    const totalOpened = Number(openEventsResult[0]?.count || 0)
    const openRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0

    return NextResponse.json({
      totalContacts: Number(totalContactsResult[0]?.count || 0),
      activeContacts: Number(activeContactsResult[0]?.count || 0),
      totalCampaigns: Number(totalCampaignsResult[0]?.count || 0),
      totalRevenue: Number(totalRevenueResult[0]?.total || 0),
      recentImports: Number(recentImportsResult[0]?.count || 0),
      openRate,
    })
  } catch (error) {
    console.error('[HEALTH]', error)
    return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 })
  }
}
