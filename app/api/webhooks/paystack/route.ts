import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { webhookEvents, contacts, revenueEvents, emailEvents } from '@/drizzle/schema'
import { eq, and, gte, desc } from 'drizzle-orm'
import { sql } from 'drizzle-orm'
import crypto from 'crypto'

function verifyPaystackSignature(body: string, signature: string): boolean {
  const secret = process.env.PAYSTACK_SECRET_KEY || ''
  const hash = crypto.createHmac('sha512', secret).update(body).digest('hex')
  return hash === signature
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = req.headers.get('x-paystack-signature') || ''

    if (!verifyPaystackSignature(body, signature)) {
      console.error('[WEBHOOK PAYSTACK] Invalid signature')
      return NextResponse.json({ ok: true }) // Return 200 to prevent retries
    }

    const payload = JSON.parse(body)
    const { event, data } = payload

    await db.insert(webhookEvents).values({
      provider: 'paystack',
      eventType: event,
      email: data?.customer?.email,
      payload,
      processed: false,
    })

    if (event === 'charge.success') {
      const email = data?.customer?.email?.toLowerCase().trim()
      const amountKobo = data?.amount || 0
      const amountZar = Math.round(amountKobo / 100) // kobo to ZAR
      const reference = data?.reference || ''
      const productName = data?.metadata?.product_name || data?.plan?.name || 'Paystack Purchase'

      if (email) {
        // Find or get contact
        const contactRow = await db.select({ id: contacts.id })
          .from(contacts)
          .where(eq(contacts.email, email))
          .limit(1)

        const contactId = contactRow[0]?.id || null

        // Attribution
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

        // Log revenue
        await db.insert(revenueEvents).values({
          contactId,
          email,
          campaignId: attributedCampaignId,
          productName,
          amountZar: amountZar * 100, // store in cents
          source: 'paystack',
          reference,
        })

        // Tag as buyer
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
            metadata: { product: productName, amount: amountZar * 100, currency: 'ZAR', source: 'paystack', reference },
          })
        }
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[WEBHOOK PAYSTACK]', error)
    return NextResponse.json({ ok: true }) // Always 200 to prevent Paystack retries
  }
}
