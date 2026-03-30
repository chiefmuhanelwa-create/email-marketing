import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { contacts, emailEvents } from '@/drizzle/schema'
import { eq } from 'drizzle-orm'
import { sql } from 'drizzle-orm'

// 1x1 transparent GIF
const PIXEL = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
)

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const email = searchParams.get('email') || ''
  const id = Number(searchParams.get('id') || '0')
  const type = searchParams.get('type') || 'campaign'

  // Async update — don't block the pixel response
  if (email) {
    try {
      // Find contact
      const contactRow = await db.select({ id: contacts.id })
        .from(contacts)
        .where(eq(contacts.email, decodeURIComponent(email)))
        .limit(1)

      const contactId = contactRow[0]?.id

      if (contactId) {
        // Update contact stats
        await db.update(contacts)
          .set({
            totalEmailsOpened: sql`total_emails_opened + 1`,
            lastEngagedAt: new Date(),
            engagementScore: sql`engagement_score + 2`,
            updatedAt: new Date(),
          })
          .where(eq(contacts.id, contactId))

        // Log event
        await db.insert(emailEvents).values({
          contactId,
          email: decodeURIComponent(email),
          campaignId: type === 'campaign' && id ? id : null,
          sequenceEmailId: type === 'sequence' && id ? id : null,
          eventType: 'opened',
        })
      }
    } catch (err) {
      console.error('[TRACK OPEN]', err)
    }
  }

  return new NextResponse(PIXEL, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
    },
  })
}
