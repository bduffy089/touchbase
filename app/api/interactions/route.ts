import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const db = getDb()
    const body = await req.json()
    const { contact_id, type, note, date } = body

    if (!contact_id || !type || !date) {
      return NextResponse.json({ error: 'contact_id, type, and date are required' }, { status: 400 })
    }

    const validTypes = ['call', 'text', 'email', 'in-person', 'other']
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid interaction type' }, { status: 400 })
    }

    const contact = db.prepare('SELECT id FROM contacts WHERE id = ?').get(contact_id)
    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    const result = db.prepare(`
      INSERT INTO interactions (contact_id, type, note, date)
      VALUES (?, ?, ?, ?)
    `).run(contact_id, type, note?.trim() || null, date)

    // Update contact updated_at
    db.prepare(`UPDATE contacts SET updated_at = datetime('now') WHERE id = ?`).run(contact_id)

    const interaction = db.prepare('SELECT * FROM interactions WHERE id = ?').get(result.lastInsertRowid)
    return NextResponse.json(interaction, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to log interaction' }, { status: 500 })
  }
}
