import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { contacts, emailEvents, campaigns, webhookEvents } from '@/drizzle/schema'
import { eq } from 'drizzle-orm'
import { sql } from 'drizzle-orm'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const payload = JSON.parse(body)

    // Log webhook
    await db.insert(webhookEvents).values({
      provider: 'resend',
      eventType: payload.type,
      email: payload.data?.email_id,
      payload,
      processed: false,
    })

    const { type, data } = payload
    const email = data?.to?.[0] || data?.email_id || ''

    if (!email) return NextResponse.json({ ok: true })

    const contact = await db.select({ id: contacts.id })
      .from(contacts)
      .where(eq(contacts.email, email.toLowerCase()))
      .limit(1)

    const contactId = contact[0]?.id || null

    if (type === 'email.opened') {
      if (contactId) {
        await db.update(contacts).set({
          totalEmailsOpened: sql`total_emails_opened + 1`,
          lastEngagedAt: new Date(),
          engagementScore: sql`engagement_score + 2`,
          updatedAt: new Date(),
        }).where(eq(contacts.id, contactId))
      }
      if (contactId) {
        await db.insert(emailEvents).values({ contactId, email, eventType: 'opened' })
      }
    } else if (type === 'email.clicked') {
      if (contactId) {
        await db.update(contacts).set({
          totalEmailsClicked: sql`total_emails_clicked + 1`,
          lastEngagedAt: new Date(),
          engagementScore: sql`engagement_score + 5`,
          updatedAt: new Date(),
        }).where(eq(contacts.id, contactId))
        await db.insert(emailEvents).values({ contactId, email, eventType: 'clicked', metadata: { url: data?.click?.link } })
      }
    } else if (type === 'email.bounced') {
      if (contactId) {
        await db.update(contacts).set({
          status: 'bounced',
          bouncedAt: new Date(),
          updatedAt: new Date(),
        }).where(eq(contacts.id, contactId))
        await db.insert(emailEvents).values({ contactId, email, eventType: 'bounced' })
      }
    } else if (type === 'email.complained') {
      if (contactId) {
        await db.update(contacts).set({
          status: 'complained',
          complainedAt: new Date(),
          updatedAt: new Date(),
        }).where(eq(contacts.id, contactId))
        await db.insert(emailEvents).values({ contactId, email, eventType: 'complained' })
      }
    }

    // Update webhook as processed
    await db.execute(sql`
      UPDATE webhook_events SET processed = true
      WHERE provider = 'resend' AND created_at > NOW() - INTERVAL '1 minute'
      ORDER BY id DESC LIMIT 1
    `)

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[WEBHOOK RESEND]', error)
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 })
  }
}
