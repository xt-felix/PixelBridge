import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  if (req.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  const response = NextResponse.next();
  const path = req.nextUrl.pathname;

  if (path.startsWith('/api/pixel/') || path.startsWith('/api/stats')) {
    response.headers.set('Access-Control-Allow-Origin', '*');
  }

  return response;
}

export const config = {
  matcher: ['/api/pixel/:path*', '/api/stats'],
};
