import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
        'Access-Control-Max-Age': '86400',
      },
    })
  }

  // API key auth: if X-API-Key header is present, validate it
  const apiKeyHeader = req.headers.get('X-API-Key')
  if (apiKeyHeader) {
    const serverKey = process.env.TOUCHBASE_API_KEY
    if (!serverKey) {
      return NextResponse.json(
        { error: 'API key auth not configured. Set TOUCHBASE_API_KEY env var.' },
        { status: 503 },
      )
    }
    if (apiKeyHeader !== serverKey) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 },
      )
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
}
