import { NextRequest, NextResponse } from 'next/server'
import { processCSVImport } from '@/lib/import'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const source = formData.get('source') as string || 'manual'
    const tagsRaw = formData.get('tags') as string || '[]'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const csvText = await file.text()
    const tags = JSON.parse(tagsRaw) as string[]

    const result = await processCSVImport({
      csvText,
      source,
      fileName: file.name,
      tags,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('[IMPORT]', error)
    return NextResponse.json({ error: 'Import failed' }, { status: 500 })
  }
}
