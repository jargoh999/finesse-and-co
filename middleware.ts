import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = [
  '/contacts',
  '/passwords',
  '/secure-notes',
  '/wifi',
  '/private-chat',
  '/api/contacts',
  '/api/passwords',
  '/api/secure-notes',
  '/api/wifi',
  '/api/chat',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for auth endpoints to avoid circular dependencies
  if (pathname.startsWith('/api/auth/')) {
    return NextResponse.next();
  }

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }



    try {
      // Verify session with the API endpoint
      const response = await fetch(`${request.nextUrl.origin}/api/auth/session`, {
        headers: {
          'Cookie': `auth-token=${token}`,
        },
      });

      if (!response.ok) {
        return NextResponse.redirect(new URL('/login', request.url));
      }

      const sessionData = await response.json();

      if (!sessionData.authenticated) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
    } catch (error) {
      // If session check fails, redirect to login
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
