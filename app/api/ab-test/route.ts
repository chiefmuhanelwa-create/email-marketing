import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { abTests } from '@/drizzle/schema'
import { sql } from 'drizzle-orm'

export async function GET() {
  try {
    const tests = await db.select().from(abTests).orderBy(sql`created_at DESC`)
    return NextResponse.json({ tests })
  } catch (error) {
    console.error('[AB-TEST GET]', error)
    return NextResponse.json({ error: 'Failed to load tests' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, subjectA, subjectB, splitPct = 50, campaignId } = body

    const [test] = await db.insert(abTests).values({
      name,
      subjectA,
      subjectB,
      splitPct,
      campaignId: campaignId || null,
      status: 'active',
    }).returning()

    return NextResponse.json(test, { status: 201 })
  } catch (error) {
    console.error('[AB-TEST POST]', error)
    return NextResponse.json({ error: 'Failed to create test' }, { status: 500 })
  }
}
