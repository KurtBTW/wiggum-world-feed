import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    if (path.startsWith('/network')) {
      if (!token || (token.role !== 'MEMBER' && token.role !== 'ADMIN')) {
        return NextResponse.redirect(new URL('/unauthorized?reason=members_only', req.url));
      }
    }

    if (path.startsWith('/admin')) {
      if (!token || token.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/unauthorized?reason=admins_only', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        
        if (path.startsWith('/apply') || path.startsWith('/status')) {
          return !!token;
        }
        
        if (path.startsWith('/network') || path.startsWith('/admin')) {
          return !!token;
        }
        
        return true;
      },
    },
  }
);

export const config = {
  matcher: ['/apply/:path*', '/status/:path*', '/network/:path*', '/admin/:path*'],
};
