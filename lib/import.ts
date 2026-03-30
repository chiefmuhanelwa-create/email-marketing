import { db } from './db'
import { contacts, importBatches } from '@/drizzle/schema'
import { eq } from 'drizzle-orm'
import { nanoid } from './utils'

interface ImportRow {
  email?: string
  Email?: string
  email_address?: string
  'e-mail'?: string
  first_name?: string
  firstname?: string
  FirstName?: string
  name?: string
  last_name?: string
  lastname?: string
  LastName?: string
  surname?: string
  phone?: string
  mobile?: string
  cell?: string
  [key: string]: string | undefined
}

function extractEmail(row: ImportRow): string | null {
  const val = row.email || row.Email || row.email_address || row['e-mail'] || ''
  return val.trim().toLowerCase() || null
}

function extractFirstName(row: ImportRow): string | null {
  const val = row.first_name || row.firstname || row.FirstName || row.name || ''
  return val.trim() || null
}

function extractLastName(row: ImportRow): string | null {
  const val = row.last_name || row.lastname || row.LastName || row.surname || ''
  return val.trim() || null
}

function extractPhone(row: ImportRow): string | null {
  const val = row.phone || row.mobile || row.cell || ''
  return val.trim() || null
}

function extractCustomFields(row: ImportRow): Record<string, string> {
  const knownFields = new Set([
    'email', 'Email', 'email_address', 'e-mail',
    'first_name', 'firstname', 'FirstName', 'name',
    'last_name', 'lastname', 'LastName', 'surname',
    'phone', 'mobile', 'cell'
  ])
  const custom: Record<string, string> = {}
  for (const [key, value] of Object.entries(row)) {
    if (!knownFields.has(key) && value) {
      custom[key] = value
    }
  }
  return custom
}

export function parseCSV(csvText: string): ImportRow[] {
  const lines = csvText.split('\n').filter(line => line.trim())
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
  const rows: ImportRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''))
    const row: ImportRow = {}
    headers.forEach((header, idx) => {
      row[header] = values[idx] || ''
    })
    rows.push(row)
  }

  return rows
}

export async function processCSVImport(params: {
  csvText: string
  source: string
  fileName: string
  tags?: string[]
}): Promise<{
  batchId: string
  imported: number
  skipped: number
  duplicates: number
  errors: string[]
}> {
  const { csvText, source, fileName, tags = [] } = params
  const batchId = nanoid()
  const rows = parseCSV(csvText)

  // Create import batch record
  await db.insert(importBatches).values({
    batchId,
    fileName,
    source,
    totalRows: rows.length,
    status: 'processing',
  })

  let imported = 0
  let skipped = 0
  let duplicates = 0
  const errors: string[] = []

  // Process in chunks of 100
  const chunkSize = 100
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize)

    for (const row of chunk) {
      const email = extractEmail(row)
      if (!email || !email.includes('@')) {
        skipped++
        continue
      }

      try {
        const firstName = extractFirstName(row)
        const lastName = extractLastName(row)
        const phone = extractPhone(row)
        const customFields = extractCustomFields(row)

        const result = await db.insert(contacts).values({
          email,
          firstName,
          lastName,
          phone,
          source: source as any,
          sourceFile: fileName,
          importBatchId: batchId,
          tags: tags as any,
          customFields: Object.keys(customFields).length > 0 ? customFields : null,
          consentGiven: true,
          consentDate: new Date(),
          status: 'active',
        }).onConflictDoNothing()

        if (result) {
          imported++
        } else {
          duplicates++
        }
      } catch (err) {
        errors.push(`Row ${i}: ${String(err)}`)
      }
    }
  }

  // Update batch record
  await db.update(importBatches)
    .set({
      importedCount: imported,
      skippedCount: skipped,
      duplicateCount: duplicates,
      errorCount: errors.length,
      status: errors.length > rows.length / 2 ? 'failed' : 'done',
      errors: errors as any,
      completedAt: new Date(),
    })
    .where(eq(importBatches.batchId, batchId))

  return { batchId, imported, skipped, duplicates, errors }
}
