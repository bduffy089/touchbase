import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = await getDb()
    const id = parseInt(params.id)
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

    const result = await db
      .prepare('DELETE FROM interactions WHERE id = ?')
      .run(id)
    if (result.changes === 0) {
      return NextResponse.json({ error: 'Interaction not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to delete interaction' }, { status: 500 })
  }
}
