import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { revenueEvents, emailEvents, contacts } from '@/drizzle/schema'
import { eq, desc, gte, and, sum, count, sql } from 'drizzle-orm'

function validateAuth(req: NextRequest): boolean {
  const auth = req.headers.get('authorization') || ''
  const token = auth.replace('Bearer ', '').trim()
  return token === process.env.APP_SECRET
}

export async function GET() {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const [totalResult, recentSales, byProduct] = await Promise.all([
      db.select({ total: sum(revenueEvents.amountZar) }).from(revenueEvents),
      db.select().from(revenueEvents).orderBy(desc(revenueEvents.occurredAt)).limit(50),
      db.select({
        product: revenueEvents.productName,
        total: sum(revenueEvents.amountZar),
        count: count(),
      }).from(revenueEvents).groupBy(revenueEvents.productName),
    ])

    const dailyData = await db.execute(sql`
      SELECT DATE(occurred_at) as date, SUM(amount_zar) as total
      FROM revenue_events
      WHERE occurred_at >= ${thirtyDaysAgo.toISOString()}
      GROUP BY DATE(occurred_at)
      ORDER BY date ASC
    `)

    const dailyMap = new Map<string, number>()
    for (const row of dailyData.rows as any[]) {
      dailyMap.set(String(row.date).split('T')[0], Number(row.total))
    }
    const dailyRevenue = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      const dateStr = d.toISOString().split('T')[0]
      dailyRevenue.push({ date: dateStr, total: dailyMap.get(dateStr) || 0 })
    }

    const byCampaign = await db.execute(sql`
      SELECT c.name as campaign_name, SUM(r.amount_zar) as total, COUNT(*) as count
      FROM revenue_events r
      LEFT JOIN campaigns c ON c.id = r.campaign_id
      WHERE r.campaign_id IS NOT NULL
      GROUP BY c.name
      ORDER BY total DESC
      LIMIT 10
    `)

    return NextResponse.json({
      totalZar: Number(totalResult[0]?.total || 0),
      recentSales,
      byProduct: byProduct.map(p => ({
        product: p.product || 'Unknown',
        total: Number(p.total || 0),
        count: Number(p.count),
      })),
      byCampaign: (byCampaign.rows as any[]).map(r => ({
        campaignName: r.campaign_name || 'Unattributed',
        total: Number(r.total),
        count: Number(r.count),
      })),
      dailyRevenue,
    })
  } catch (error) {
    console.error('[REVENUE GET]', error)
    return NextResponse.json({ error: 'Failed to load revenue' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader && !validateAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { email, product, amount, source, externalId } = body

    if (!email || !amount) {
      return NextResponse.json({ error: 'email and amount required' }, { status: 400 })
    }

    const amountZar = Math.round(Number(amount) * 100)

    const contactRow = await db.select({ id: contacts.id })
      .from(contacts)
      .where(eq(contacts.email, email.toLowerCase().trim()))
      .limit(1)

    const contactId = contactRow[0]?.id || null

    let attributedCampaignId: number | null = null
    if (contactId) {
      const seventyTwoHoursAgo = new Date(Date.now() - 72 * 60 * 60 * 1000)
      const lastEvent = await db.select({ campaignId: emailEvents.campaignId })
        .from(emailEvents)
        .where(and(
          eq(emailEvents.contactId, contactId),
          gte(emailEvents.occurredAt, seventyTwoHoursAgo),
          sql`${emailEvents.campaignId} IS NOT NULL`
        ))
        .orderBy(desc(emailEvents.occurredAt))
        .limit(1)

      attributedCampaignId = lastEvent[0]?.campaignId || null
    }

    const [rev] = await db.insert(revenueEvents).values({
      contactId,
      email: email.toLowerCase().trim(),
      campaignId: attributedCampaignId,
      productName: product || null,
      amountZar,
      source: source || 'manual',
      reference: externalId || null,
    }).returning()

    if (contactId) {
      await db.execute(sql`
        UPDATE contacts
        SET
          tags = CASE
            WHEN tags IS NULL THEN '["buyer"]'::jsonb
            WHEN NOT (tags @> '["buyer"]'::jsonb) THEN tags || '["buyer"]'::jsonb
            ELSE tags
          END,
          engagement_score = engagement_score + 20,
          updated_at = NOW()
        WHERE id = ${contactId}
      `)

      await db.insert(emailEvents).values({
        contactId,
        email: email.toLowerCase().trim(),
        campaignId: attributedCampaignId,
        eventType: 'sale',
        metadata: { product, amount: amountZar, currency: 'ZAR', source },
      })
    }

    return NextResponse.json({ ok: true, id: rev.id, attributedCampaignId })
  } catch (error) {
    console.error('[REVENUE POST]', error)
    return NextResponse.json({ error: 'Failed to log revenue' }, { status: 500 })
  }
}
