import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET() {
  try {
    const db = await getDb()
    const tags = await db
      .prepare('SELECT * FROM tags ORDER BY name COLLATE NOCASE ASC')
      .all()
    return NextResponse.json(tags)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = await getDb()
    const { name, color } = await req.json()

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const existing = await db
      .prepare('SELECT id FROM tags WHERE name = ?')
      .get(name.trim().toLowerCase())
    if (existing) {
      return NextResponse.json({ error: 'Tag already exists' }, { status: 409 })
    }

    const TAG_COLORS = [
      '#7C3AED', '#10B981', '#3B82F6', '#F59E0B', '#EC4899',
      '#EF4444', '#06B6D4', '#8B5CF6', '#F97316', '#14B8A6',
    ]
    const autoColor = color || TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)]

    const result = await db
      .prepare('INSERT INTO tags (name, color) VALUES (?, ?)')
      .run(name.trim().toLowerCase(), autoColor)
    const tag = await db
      .prepare('SELECT * FROM tags WHERE id = ?')
      .get(Number(result.lastInsertRowid))
    return NextResponse.json(tag, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to create tag' }, { status: 500 })
  }
}
