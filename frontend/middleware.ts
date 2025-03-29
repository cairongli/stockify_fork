import { NextRequest, NextResponse } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If there's no session and the user is trying to access a protected route
  if (!session && req.nextUrl.pathname !== '/' && 
      req.nextUrl.pathname !== '/signup' && 
      req.nextUrl.pathname !== '/login' && 
      req.nextUrl.pathname !== '/posts') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // If there's a session and the user is trying to access auth pages
  if (session && (req.nextUrl.pathname === '/' || 
      req.nextUrl.pathname === '/signup' || 
      req.nextUrl.pathname === '/login')) {
    return NextResponse.redirect(new URL('/posts', req.url));
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
  