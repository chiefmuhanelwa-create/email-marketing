import { NextRequest, NextResponse } from 'next/server'

const allowedOrigins = [
  'https://contentpreneurhub.online',
  'https://www.contentpreneurhub.online',
  'https://nochill.co.za',
  'https://www.nochill.co.za',
  'http://localhost:3000',
]

const corsRoutes = [
  '/api/contacts/subscribe',
  '/api/revenue',
]

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname
  const isCorsRoute = corsRoutes.some(route => pathname.startsWith(route))

  if (!isCorsRoute) {
    return NextResponse.next()
  }

  const origin = req.headers.get('origin') || ''
  const isAllowed = allowedOrigins.includes(origin)

  // Handle preflight
  if (req.method === 'OPTIONS') {
    const res = new NextResponse(null, { status: 204 })
    if (isAllowed) {
      res.headers.set('Access-Control-Allow-Origin', origin)
      res.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
      res.headers.set('Access-Control-Max-Age', '86400')
    }
    return res
  }

  const response = NextResponse.next()
  if (isAllowed) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  }
  return response
}

export const config = {
  matcher: ['/api/contacts/subscribe', '/api/revenue'],
}
