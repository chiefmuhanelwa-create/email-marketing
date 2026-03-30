import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { webhookEvents, contacts, revenueEvents, emailEvents } from '@/drizzle/schema'
import { eq, and, gte, desc } from 'drizzle-orm'
import { sql } from 'drizzle-orm'

const USD_TO_ZAR = Number(process.env.GUMROAD_ZAR_RATE || '18.5')

export async function POST(req: NextRequest) {
  try {
    // Gumroad sends form data
    const formData = await req.formData()
    const email = (formData.get('email') as string || '').toLowerCase().trim()
    const productName = formData.get('product_name') as string || 'Gumroad Purchase'
    const priceUsdCents = Number(formData.get('price') || '0')
    const orderId = formData.get('sale_id') as string || formData.get('order_id') as string || ''

    const priceZar = Math.round((priceUsdCents / 100) * USD_TO_ZAR)
    const amountZarCents = priceZar * 100

    await db.insert(webhookEvents).values({
      provider: 'gumroad',
      eventType: 'sale',
      email,
      payload: { email, productName, priceUsdCents, orderId },
      processed: false,
    })

    if (email) {
      const contactRow = await db.select({ id: contacts.id })
        .from(contacts)
        .where(eq(contacts.email, email))
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

      await db.insert(revenueEvents).values({
        contactId,
        email,
        campaignId: attributedCampaignId,
        productName,
        amountZar: amountZarCents,
        source: 'gumroad',
        reference: orderId,
      })

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
          email,
          campaignId: attributedCampaignId,
          eventType: 'sale',
          metadata: { product: productName, amount: amountZarCents, currency: 'ZAR', source: 'gumroad', reference: orderId },
        })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[WEBHOOK GUMROAD]', error)
    return NextResponse.json({ ok: true })
  }
}
