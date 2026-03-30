import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { contacts, sequences, sequenceEnrollments } from '@/drizzle/schema'
import { eq } from 'drizzle-orm'

function validateAuth(req: NextRequest): boolean {
  const auth = req.headers.get('authorization') || ''
  const token = auth.replace('Bearer ', '').trim()
  return token === process.env.APP_SECRET
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

export async function POST(req: NextRequest) {
  if (!validateAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const {
      email,
      firstName,
      lastName,
      phone,
      source = 'website_subscription',
      tags = [],
      sequenceTag,
    } = body

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }

    // Check if contact already exists
    const existing = await db.select({ id: contacts.id })
      .from(contacts)
      .where(eq(contacts.email, email.toLowerCase().trim()))
      .limit(1)

    let contactId: number
    let isNew = false

    if (existing.length > 0) {
      contactId = existing[0].id
    } else {
      const inserted = await db.insert(contacts).values({
        email: email.toLowerCase().trim(),
        firstName: firstName || null,
        lastName: lastName || null,
        phone: phone || null,
        source,
        tags: tags as any,
        status: 'active',
        consentGiven: true,
        consentDate: new Date(),
      }).returning({ id: contacts.id })

      contactId = inserted[0].id
      isNew = true
    }

    // Auto-enroll in sequence if sequenceTag provided
    let enrolled = false
    if (sequenceTag) {
      const sequence = await db.select({ id: sequences.id })
        .from(sequences)
        .where(eq(sequences.triggerTag, sequenceTag))
        .limit(1)

      if (sequence.length > 0) {
        await db.insert(sequenceEnrollments).values({
          sequenceId: sequence[0].id,
          contactId,
          currentStep: 1,
          status: 'active',
          nextSendAt: new Date(),
        }).onConflictDoNothing()
        enrolled = true
      }
    }

    return NextResponse.json({ ok: true, contactId, isNew, enrolled })
  } catch (error) {
    console.error('[CONTACTS SUBSCRIBE]', error)
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 })
  }
}
