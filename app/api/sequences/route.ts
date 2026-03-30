import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sequences, sequenceEmails, sequenceEnrollments, contacts, segments } from '@/drizzle/schema'
import { eq, and, count, sql } from 'drizzle-orm'

export async function GET() {
  try {
    const allSequences = await db.select().from(sequences).orderBy(sql`created_at DESC`)

    const result = await Promise.all(allSequences.map(async seq => {
      const emails = await db.select().from(sequenceEmails)
        .where(eq(sequenceEmails.sequenceId, seq.id))
        .orderBy(sequenceEmails.stepNumber)

      const enrollmentResult = await db.select({ count: count() })
        .from(sequenceEnrollments)
        .where(and(eq(sequenceEnrollments.sequenceId, seq.id), eq(sequenceEnrollments.status, 'active')))

      return {
        ...seq,
        emails,
        enrollmentCount: Number(enrollmentResult[0]?.count || 0),
      }
    }))

    return NextResponse.json({ sequences: result })
  } catch (error) {
    console.error('[SEQUENCES GET]', error)
    return NextResponse.json({ error: 'Failed to load sequences' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action } = body

    if (action === 'enroll') {
      const { sequenceId, segmentId } = body

      const segment = await db.select().from(segments).where(eq(segments.id, segmentId)).limit(1)
      if (!segment.length) return NextResponse.json({ error: 'Segment not found' }, { status: 404 })

      const seg = segment[0]
      const rules = (seg.rules as any[]) || []
      const rule = rules[0]

      let contactIds: number[] = []

      if (rule?.field === 'source' && rule.operator === 'equals') {
        const rows = await db.select({ id: contacts.id }).from(contacts)
          .where(and(eq(contacts.source, rule.value), eq(contacts.status, 'active')))
        contactIds = rows.map(r => r.id)
      } else if (rule?.field === 'tags' && rule.operator === 'contains') {
        const rows = await db.select({ id: contacts.id }).from(contacts)
          .where(and(sql`${contacts.tags}::jsonb ? ${rule.value}`, eq(contacts.status, 'active')))
        contactIds = rows.map(r => r.id)
      } else {
        const rows = await db.select({ id: contacts.id }).from(contacts).where(eq(contacts.status, 'active'))
        contactIds = rows.map(r => r.id)
      }

      let enrolled = 0
      for (const contactId of contactIds) {
        await db.insert(sequenceEnrollments).values({
          sequenceId,
          contactId,
          currentStep: 1,
          status: 'active',
          nextSendAt: new Date(),
        }).onConflictDoNothing()
        enrolled++
      }

      return NextResponse.json({ ok: true, enrolled })
    }

    const { name, description, triggerTag, emails = [] } = body

    const [seq] = await db.insert(sequences).values({
      name,
      description,
      triggerTag: triggerTag || null,
      status: 'active',
    }).returning()

    if (emails.length > 0) {
      for (const email of emails) {
        await db.insert(sequenceEmails).values({
          sequenceId: seq.id,
          stepNumber: email.stepNumber,
          delayDays: email.delayDays || 0,
          subject: email.subject,
          previewText: email.previewText || null,
          htmlContent: email.htmlContent || null,
          textContent: email.textContent || null,
        })
      }
    }

    const seqEmails = await db.select().from(sequenceEmails)
      .where(eq(sequenceEmails.sequenceId, seq.id))
      .orderBy(sequenceEmails.stepNumber)

    return NextResponse.json({ ...seq, emails: seqEmails }, { status: 201 })
  } catch (error) {
    console.error('[SEQUENCES POST]', error)
    return NextResponse.json({ error: 'Failed to create sequence' }, { status: 500 })
  }
}
