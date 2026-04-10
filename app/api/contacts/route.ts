import { NextRequest, NextResponse } from 'next/server'
import { getDb, getContactsQuery } from '@/lib/db'
import { parseTagsFromRow } from '@/lib/utils'

export async function GET(req: NextRequest) {
  try {
    const db = getDb()
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q') || undefined
    const tagIdStr = searchParams.get('tagId')
    const tagId = tagIdStr ? parseInt(tagIdStr) : undefined

    const rows = getContactsQuery(db, { q, tagId }) as Record<string, unknown>[]
    const contacts = rows.map((row) => ({ ...row, tags: parseTagsFromRow(row) }))
    return NextResponse.json(contacts)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb()
    const body = await req.json()
    const { name, email, phone, company, how_met, notes, cadence_days, tagIds } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const result = db.prepare(`
      INSERT INTO contacts (name, email, phone, company, how_met, notes, cadence_days)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      name.trim(),
      email?.trim() || null,
      phone?.trim() || null,
      company?.trim() || null,
      how_met?.trim() || null,
      notes?.trim() || null,
      cadence_days ?? 30,
    )

    const contactId = result.lastInsertRowid as number

    if (Array.isArray(tagIds) && tagIds.length > 0) {
      const insertTag = db.prepare('INSERT OR IGNORE INTO contact_tags (contact_id, tag_id) VALUES (?, ?)')
      for (const tagId of tagIds) {
        insertTag.run(contactId, tagId)
      }
    }

    const contact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(contactId)
    return NextResponse.json(contact, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 })
  }
}
