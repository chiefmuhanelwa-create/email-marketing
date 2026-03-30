import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sequenceEnrollments, sequenceEmails, contacts, sequences } from '@/drizzle/schema'
import { eq, and, lte } from 'drizzle-orm'
import { sql } from 'drizzle-orm'
import { sendViaResend, wrapEmailTemplate } from '@/lib/email'

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '').trim()
  if (token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()

    // Find all active enrollments due to send
    const dueEnrollments = await db.select({
      enrollment: sequenceEnrollments,
      contact: { id: contacts.id, email: contacts.email, status: contacts.status },
    })
    .from(sequenceEnrollments)
    .innerJoin(contacts, eq(sequenceEnrollments.contactId, contacts.id))
    .where(and(
      eq(sequenceEnrollments.status, 'active'),
      lte(sequenceEnrollments.nextSendAt, now)
    ))
    .limit(500)

    let sent = 0
    let skipped = 0

    for (const { enrollment, contact } of dueEnrollments) {
      // Skip if contact is not active
      if (contact.status !== 'active') {
        await db.update(sequenceEnrollments)
          .set({ status: 'paused' })
          .where(eq(sequenceEnrollments.id, enrollment.id))
        skipped++
        continue
      }

      // Get the email for this step
      const emailStep = await db.select()
        .from(sequenceEmails)
        .where(and(
          eq(sequenceEmails.sequenceId, enrollment.sequenceId),
          eq(sequenceEmails.stepNumber, enrollment.currentStep)
        ))
        .limit(1)

      if (!emailStep.length) {
        // No email for this step — mark complete
        await db.update(sequenceEnrollments)
          .set({ status: 'completed', completedAt: new Date() })
          .where(eq(sequenceEnrollments.id, enrollment.id))
        skipped++
        continue
      }

      const step = emailStep[0]

      try {
        const wrappedHtml = wrapEmailTemplate({
          htmlBody: step.htmlContent || '',
          contactEmail: contact.email,
          contactId: contact.id,
          sequenceEmailId: step.id,
          trackingType: 'sequence',
        })

        await sendViaResend({
          to: contact.email,
          subject: step.subject,
          html: wrappedHtml,
          text: step.textContent || '',
        })

        // Update contact stats
        await db.update(contacts).set({
          totalEmailsSent: sql`total_emails_sent + 1`,
          updatedAt: new Date(),
        }).where(eq(contacts.id, contact.id))

        // Find next step
        const nextStep = await db.select()
          .from(sequenceEmails)
          .where(and(
            eq(sequenceEmails.sequenceId, enrollment.sequenceId),
            eq(sequenceEmails.stepNumber, enrollment.currentStep + 1)
          ))
          .limit(1)

        if (nextStep.length) {
          const nextSendAt = new Date(Date.now() + nextStep[0].delayDays * 24 * 60 * 60 * 1000)
          await db.update(sequenceEnrollments).set({
            currentStep: enrollment.currentStep + 1,
            nextSendAt,
          }).where(eq(sequenceEnrollments.id, enrollment.id))
        } else {
          await db.update(sequenceEnrollments).set({
            status: 'completed',
            completedAt: new Date(),
          }).where(eq(sequenceEnrollments.id, enrollment.id))
        }

        sent++
      } catch (err) {
        console.error('[CRON SEQUENCES] Send error for', contact.email, err)
        skipped++
      }

      // Small delay between sends
      await new Promise(r => setTimeout(r, 100))
    }

    return NextResponse.json({ ok: true, sent, skipped, processed: dueEnrollments.length })
  } catch (error) {
    console.error('[CRON SEQUENCES]', error)
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 })
  }
}
