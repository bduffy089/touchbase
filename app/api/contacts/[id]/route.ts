import { NextRequest, NextResponse } from 'next/server'
import { getDb, getContactByIdQuery } from '@/lib/db'
import { parseTagsFromRow } from '@/lib/utils'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = await getDb()
    const id = parseInt(params.id)
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

    const row = (await getContactByIdQuery(db, id)) as any
    if (!row) return NextResponse.json({ error: 'Contact not found' }, { status: 404 })

    return NextResponse.json({ ...row, tags: parseTagsFromRow(row) })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to fetch contact' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = await getDb()
    const id = parseInt(params.id)
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

    const existing = await db.prepare('SELECT id FROM contacts WHERE id = ?').get(id)
    if (!existing) return NextResponse.json({ error: 'Contact not found' }, { status: 404 })

    const body = await req.json()
    const { name, email, phone, company, how_met, notes, cadence_days, tagIds } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    await db
      .prepare(
        `UPDATE contacts
         SET name = ?, email = ?, phone = ?, company = ?, how_met = ?, notes = ?, cadence_days = ?, updated_at = datetime('now')
         WHERE id = ?`,
      )
      .run(
        name.trim(),
        email?.trim() || null,
        phone?.trim() || null,
        company?.trim() || null,
        how_met?.trim() || null,
        notes?.trim() || null,
        cadence_days ?? 30,
        id,
      )

    await db.prepare('DELETE FROM contact_tags WHERE contact_id = ?').run(id)
    if (Array.isArray(tagIds) && tagIds.length > 0) {
      for (const tagId of tagIds) {
        await db
          .prepare('INSERT OR IGNORE INTO contact_tags (contact_id, tag_id) VALUES (?, ?)')
          .run(id, tagId)
      }
    }

    const row = (await getContactByIdQuery(db, id)) as any
    return NextResponse.json({ ...row, tags: parseTagsFromRow(row) })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to update contact' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = await getDb()
    const id = parseInt(params.id)
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

    const result = await db.prepare('DELETE FROM contacts WHERE id = ?').run(id)
    if (result.changes === 0) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to delete contact' }, { status: 500 })
  }
}
