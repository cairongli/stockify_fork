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
      '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|^$).*)',
    ],
  }
  