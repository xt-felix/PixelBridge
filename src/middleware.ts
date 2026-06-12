import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  if (request.method === 'OPTIONS') {
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

  if (request.nextUrl.pathname.startsWith('/api/pixel/') || request.nextUrl.pathname === '/pixelbridge.js') {
    response.headers.set('Access-Control-Allow-Origin', '*');
  }

  return response;
}

export const config = {
  matcher: ['/api/pixel/:path*', '/pixelbridge.js'],
};
