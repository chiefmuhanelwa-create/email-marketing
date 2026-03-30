import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { campaigns, contacts, emailEvents } from '@/drizzle/schema'
import { eq, and, sql } from 'drizzle-orm'
import { sendViaSES, sendViaResend, wrapEmailTemplate } from '@/lib/email'

export async function GET() {
  try {
    const allCampaigns = await db.select().from(campaigns).orderBy(sql`created_at DESC`)
    return NextResponse.json({ campaigns: allCampaigns })
  } catch (error) {
    console.error('[CAMPAIGNS GET]', error)
    return NextResponse.json({ error: 'Failed to load campaigns' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const action = searchParams.get('action')
    const campaignId = searchParams.get('id')

    if (action === 'send' && campaignId) {
      return sendCampaignNow(Number(campaignId))
    }

    const body = await req.json()
    const {
      name, subject, previewText, htmlContent, textContent,
      provider = 'ses', segmentIds = [], sendToAll = false, scheduledAt
    } = body

    const status = scheduledAt ? 'scheduled' : 'draft'

    const [campaign] = await db.insert(campaigns).values({
      name,
      subject,
      previewText,
      htmlContent,
      textContent,
      provider,
      segmentIds: segmentIds as any,
      sendToAll,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      status,
    }).returning()

    return NextResponse.json(campaign, { status: 201 })
  } catch (error) {
    console.error('[CAMPAIGNS POST]', error)
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 })
  }
}

async function sendCampaignNow(campaignId: number) {
  const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, campaignId))
  if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
  if (campaign.status === 'sent') return NextResponse.json({ error: 'Already sent' }, { status: 400 })

  await db.update(campaigns).set({ status: 'sending' }).where(eq(campaigns.id, campaignId))

  try {
    // Get recipients
    let recipients: Array<{ id: number; email: string }> = []

    if (campaign.sendToAll) {
      recipients = await db.select({ id: contacts.id, email: contacts.email })
        .from(contacts)
        .where(eq(contacts.status, 'active'))
    }

    // Send in batches
    let sent = 0
    const batchSize = 100
    const sender = campaign.provider === 'ses' ? sendViaSES : sendViaResend

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize)
      for (const recipient of batch) {
        try {
          const wrappedHtml = wrapEmailTemplate({
            htmlBody: campaign.htmlContent || '',
            contactEmail: recipient.email,
            contactId: recipient.id,
            campaignId: campaign.id,
            trackingType: 'campaign',
          })

          await sender({
            to: recipient.email,
            subject: campaign.subject,
            html: wrappedHtml,
            text: campaign.textContent || '',
          })

          await db.insert(emailEvents).values({
            contactId: recipient.id,
            email: recipient.email,
            campaignId: campaign.id,
            eventType: 'sent',
          })

          sent++
        } catch (err) {
          console.error('[CAMPAIGNS SEND] error for', recipient.email, err)
        }
      }
      await new Promise(r => setTimeout(r, 100))
    }

    await db.update(campaigns).set({
      status: 'sent',
      sentAt: new Date(),
      totalSent: sent,
      totalRecipients: recipients.length,
    }).where(eq(campaigns.id, campaignId))

    return NextResponse.json({ ok: true, sent })
  } catch (error) {
    await db.update(campaigns).set({ status: 'paused' }).where(eq(campaigns.id, campaignId))
    throw error
  }
}
