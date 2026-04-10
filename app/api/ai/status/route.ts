import { NextResponse } from 'next/server'
import type { AiStatusResponse } from '@/types'

export async function GET() {
  const available = Boolean(process.env.ANTHROPIC_API_KEY)
  return NextResponse.json<AiStatusResponse>({ available })
}
