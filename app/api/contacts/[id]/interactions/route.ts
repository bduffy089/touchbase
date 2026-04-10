import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = getDb()
    const id = parseInt(params.id)
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

    const interactions = db.prepare(`
      SELECT * FROM interactions
      WHERE contact_id = ?
      ORDER BY date DESC, created_at DESC
    `).all(id)

    return NextResponse.json(interactions)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to fetch interactions' }, { status: 500 })
  }
}
