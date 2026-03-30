import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { campaigns, contacts, emailEvents } from '@/drizzle/schema'
import { eq, and, lte } from 'drizzle-orm'
import { sendViaSES, sendViaResend, wrapEmailTemplate } from '@/lib/email'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '').trim()
  if (token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()

    // Find scheduled campaigns due to send
    const dueCampaigns = await db.select()
      .from(campaigns)
      .where(and(
        eq(campaigns.status, 'scheduled'),
        lte(campaigns.scheduledAt, now)
      ))
      .limit(5)

    let processedCampaigns = 0

    for (const campaign of dueCampaigns) {
      await db.update(campaigns).set({ status: 'sending' }).where(eq(campaigns.id, campaign.id))

      try {
        let recipients: Array<{ id: number; email: string }> = []

        if (campaign.sendToAll) {
          recipients = await db.select({ id: contacts.id, email: contacts.email })
            .from(contacts)
            .where(eq(contacts.status, 'active'))
        }

        let sent = 0
        const sender = campaign.provider === 'ses' ? sendViaSES : sendViaResend

        for (let i = 0; i < recipients.length; i += 100) {
          const batch = recipients.slice(i, i + 100)
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
              console.error('[CRON CAMPAIGNS] Send error for', recipient.email, err)
            }
          }
          await new Promise(r => setTimeout(r, 100))
        }

        await db.update(campaigns).set({
          status: 'sent',
          sentAt: new Date(),
          totalSent: sent,
          totalRecipients: recipients.length,
        }).where(eq(campaigns.id, campaign.id))

        processedCampaigns++
      } catch (err) {
        console.error('[CRON CAMPAIGNS] Campaign error', campaign.id, err)
        await db.update(campaigns).set({ status: 'paused' }).where(eq(campaigns.id, campaign.id))
      }
    }

    return NextResponse.json({ ok: true, processedCampaigns })
  } catch (error) {
    console.error('[CRON CAMPAIGNS]', error)
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 })
  }
}
