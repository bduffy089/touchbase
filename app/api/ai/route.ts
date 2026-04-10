import { NextRequest, NextResponse } from 'next/server'
import { streamText, generateText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { getDb, getContactByIdQuery } from '@/lib/db'
import { parseTagsFromRow } from '@/lib/utils'
import { buildSuggestMessagePrompt, buildParseLinkedInPrompt } from '@/lib/ai'
import type { ContactWithStatus, Interaction, MessageChannel, AiAction } from '@/types'

const VALID_ACTIONS: AiAction[] = ['suggest-message', 'parse-linkedin']
const VALID_CHANNELS: MessageChannel[] = ['linkedin', 'email', 'text']
const MODEL = 'claude-sonnet-4-5'

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'AI features are not configured. Set ANTHROPIC_API_KEY.' },
      { status: 503 },
    )
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const action = body.action as AiAction
  if (!VALID_ACTIONS.includes(action)) {
    return NextResponse.json(
      { error: `Invalid action. Must be one of: ${VALID_ACTIONS.join(', ')}` },
      { status: 400 },
    )
  }

  try {
    if (action === 'suggest-message') {
      return handleSuggestMessage(body)
    }
    if (action === 'parse-linkedin') {
      return handleParseLinkedIn(body)
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI request failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

async function handleSuggestMessage(body: Record<string, unknown>) {
  const contactId = Number(body.contactId)
  if (!contactId || isNaN(contactId)) {
    return NextResponse.json({ error: 'contactId is required' }, { status: 400 })
  }

  const channel = (body.channel as MessageChannel) ?? 'linkedin'
  if (!VALID_CHANNELS.includes(channel)) {
    return NextResponse.json(
      { error: `Invalid channel. Must be one of: ${VALID_CHANNELS.join(', ')}` },
      { status: 400 },
    )
  }

  const db = await getDb()
  const row = (await getContactByIdQuery(db, contactId)) as Record<string, unknown> | undefined
  if (!row) {
    return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
  }

  const contact = { ...row, tags: parseTagsFromRow(row) } as ContactWithStatus
  const interactions = (await db
    .prepare('SELECT * FROM interactions WHERE contact_id = ? ORDER BY date DESC LIMIT 3')
    .all(contactId)) as unknown as Interaction[]

  const { system, user } = buildSuggestMessagePrompt(contact, interactions, channel)

  const result = streamText({
    model: anthropic(MODEL),
    system,
    prompt: user,
    maxOutputTokens: 500,
  })

  return result.toTextStreamResponse()
}

async function handleParseLinkedIn(body: Record<string, unknown>) {
  const text = body.text as string
  if (!text?.trim()) {
    return NextResponse.json({ error: 'text is required' }, { status: 400 })
  }

  const { system, user } = buildParseLinkedInPrompt(text.trim())

  const result = await generateText({
    model: anthropic(MODEL),
    system,
    prompt: user,
    maxOutputTokens: 2000,
  })

  const extracted = extractJson(result.text)
  if (!extracted) {
    return NextResponse.json(
      { error: 'Failed to parse AI response', raw: result.text },
      { status: 500 },
    )
  }
  return NextResponse.json(extracted)
}

function extractJson(text: string): unknown | null {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim()

  try {
    return JSON.parse(cleaned)
  } catch {}

  const firstBrace = cleaned.indexOf('{')
  const lastBrace = cleaned.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1))
    } catch {}
  }
  return null
}
