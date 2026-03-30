import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { contacts, emailEvents } from '@/drizzle/schema'
import { eq } from 'drizzle-orm'
import { sql } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const url = searchParams.get('url') || ''
  const email = searchParams.get('email') || ''
  const id = Number(searchParams.get('id') || '0')
  const type = searchParams.get('type') || 'campaign'

  const decodedUrl = decodeURIComponent(url)
  const decodedEmail = decodeURIComponent(email)

  // Track the click
  if (decodedEmail && decodedUrl) {
    try {
      const contactRow = await db.select({ id: contacts.id })
        .from(contacts)
        .where(eq(contacts.email, decodedEmail))
        .limit(1)

      const contactId = contactRow[0]?.id

      if (contactId) {
        await db.update(contacts)
          .set({
            totalEmailsClicked: sql`total_emails_clicked + 1`,
            lastEngagedAt: new Date(),
            engagementScore: sql`engagement_score + 5`,
            updatedAt: new Date(),
          })
          .where(eq(contacts.id, contactId))

        await db.insert(emailEvents).values({
          contactId,
          email: decodedEmail,
          campaignId: type === 'campaign' && id ? id : null,
          sequenceEmailId: type === 'sequence' && id ? id : null,
          eventType: 'clicked',
          metadata: { url: decodedUrl },
        })
      }
    } catch (err) {
      console.error('[TRACK CLICK]', err)
    }
  }

  // Redirect to the original URL
  if (decodedUrl.startsWith('http://') || decodedUrl.startsWith('https://')) {
    return NextResponse.redirect(decodedUrl, { status: 302 })
  }

  return NextResponse.redirect('https://nochill.co.za', { status: 302 })
}
