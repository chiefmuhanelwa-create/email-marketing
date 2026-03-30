import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { contacts, emailEvents, webhookEvents } from '@/drizzle/schema'
import { eq } from 'drizzle-orm'
import { sql } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const snsMessage = JSON.parse(body)

    // SNS subscription confirmation
    if (snsMessage.Type === 'SubscriptionConfirmation') {
      console.log('[WEBHOOK SES] SNS subscription URL:', snsMessage.SubscribeURL)
      return NextResponse.json({ ok: true })
    }

    const message = JSON.parse(snsMessage.Message || '{}')
    const { notificationType, bounce, complaint, mail } = message

    const email = mail?.destination?.[0] || ''
    if (!email) return NextResponse.json({ ok: true })

    await db.insert(webhookEvents).values({
      provider: 'ses',
      eventType: notificationType,
      email,
      payload: message,
      processed: false,
    })

    const contact = await db.select({ id: contacts.id })
      .from(contacts)
      .where(eq(contacts.email, email.toLowerCase()))
      .limit(1)

    const contactId = contact[0]?.id || null

    if (notificationType === 'Bounce' && bounce?.bounceType === 'Permanent') {
      if (contactId) {
        await db.update(contacts).set({
          status: 'bounced',
          bouncedAt: new Date(),
          updatedAt: new Date(),
        }).where(eq(contacts.id, contactId))
        await db.insert(emailEvents).values({ contactId, email, eventType: 'bounced' })
      }
    } else if (notificationType === 'Complaint') {
      if (contactId) {
        await db.update(contacts).set({
          status: 'complained',
          complainedAt: new Date(),
          updatedAt: new Date(),
        }).where(eq(contacts.id, contactId))
        await db.insert(emailEvents).values({ contactId, email, eventType: 'complained' })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[WEBHOOK SES]', error)
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 })
  }
}
