import { NextRequest, NextResponse } from 'next/server'

import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({req, res});

  const {
    data: {
        session
    }
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.rewrite(new URL('/', req.url))
  }
  return res
};

export const config = {
    matcher: [
      /*
       * Apply middleware to all paths except:
       * - _next/static (static files)
       * - _next/image (image optimization files)
       * - favicon.ico (favicon file)
       * - Image files (svg, png, jpg, etc.)
       * - Root path "/" for the homepage (login/signup)
       */
      '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|^$|^/signup$|^/polygontest$).*)',
    ],
  }
  