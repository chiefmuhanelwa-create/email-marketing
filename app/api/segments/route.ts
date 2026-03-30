import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { segments, contacts, contactSegments } from '@/drizzle/schema'
import { eq, count, sql } from 'drizzle-orm'

// Default NOCHILL segments seeded once
const DEFAULT_SEGMENTS = [
  {
    name: 'Creators',
    description: 'Have audiences, want to monetise their content',
    type: 'creator',
    color: '#F97316',
    rules: [{ field: 'source', operator: 'in', value: ['survey', 'social_media'] }],
  },
  {
    name: 'Learners',
    description: 'Downloaded PDFs, want structured knowledge',
    type: 'learner',
    color: '#3b82f6',
    rules: [{ field: 'source', operator: 'equals', value: 'pdf_download' }],
  },
  {
    name: 'Brand Fans',
    description: 'Subscribed via website, already know NOCHILL',
    type: 'brand_fan',
    color: '#22c55e',
    rules: [{ field: 'source', operator: 'equals', value: 'website_subscription' }],
  },
  {
    name: 'Buyers',
    description: 'Have purchased at least one product',
    type: 'buyer',
    color: '#a855f7',
    rules: [{ field: 'tags', operator: 'contains', value: 'buyer' }],
  },
  {
    name: 'Unknown',
    description: 'No source data — need profiling',
    type: 'unknown',
    color: '#666666',
    rules: [{ field: 'source', operator: 'is_null' }],
  },
]

async function seedDefaultSegments() {
  const existing = await db.select({ count: count() }).from(segments)
  if (Number(existing[0]?.count || 0) > 0) return

  for (const seg of DEFAULT_SEGMENTS) {
    await db.insert(segments).values(seg as any)
  }
}

async function updateSegmentCounts() {
  const allSegments = await db.select().from(segments)

  for (const seg of allSegments) {
    let contactCount = 0
    const rules = (seg.rules as any[]) || []
    const rule = rules[0]

    if (!rule) continue

    try {
      if (rule.field === 'source' && rule.operator === 'equals') {
        const result = await db.select({ count: count() }).from(contacts)
          .where(eq(contacts.source, rule.value))
        contactCount = Number(result[0]?.count || 0)
      } else if (rule.field === 'source' && rule.operator === 'in') {
        const result = await db.select({ count: count() }).from(contacts)
          .where(sql`${contacts.source} = ANY(${rule.value})`)
        contactCount = Number(result[0]?.count || 0)
      } else if (rule.field === 'tags' && rule.operator === 'contains') {
        const result = await db.select({ count: count() }).from(contacts)
          .where(sql`${contacts.tags}::jsonb ? ${rule.value}`)
        contactCount = Number(result[0]?.count || 0)
      } else if (rule.field === 'source' && rule.operator === 'is_null') {
        const result = await db.select({ count: count() }).from(contacts)
          .where(sql`${contacts.source} IS NULL`)
        contactCount = Number(result[0]?.count || 0)
      }

      await db.update(segments)
        .set({ contactCount, lastCalculatedAt: new Date() })
        .where(eq(segments.id, seg.id))
    } catch (err) {
      console.error('[SEGMENTS] count error for segment', seg.id, err)
    }
  }
}

export async function GET() {
  try {
    await seedDefaultSegments()
    await updateSegmentCounts()
    const allSegments = await db.select().from(segments)
    return NextResponse.json({ segments: allSegments })
  } catch (error) {
    console.error('[SEGMENTS GET]', error)
    return NextResponse.json({ error: 'Failed to load segments' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, description, type = 'custom', color = '#F97316', rules } = body

    const [seg] = await db.insert(segments).values({
      name,
      description,
      type,
      color,
      rules: rules || [],
    }).returning()

    return NextResponse.json(seg, { status: 201 })
  } catch (error) {
    console.error('[SEGMENTS POST]', error)
    return NextResponse.json({ error: 'Failed to create segment' }, { status: 500 })
  }
}
