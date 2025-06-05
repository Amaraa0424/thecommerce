import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    // Redirect authenticated users away from auth pages
    if (token && (pathname.startsWith("/auth/login") || pathname.startsWith("/auth/register"))) {
      return NextResponse.redirect(new URL("/", req.url))
    }

    // Add security headers
    const response = NextResponse.next()
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    
    return response
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        // Allow access to auth pages for unauthenticated users
        if (pathname.startsWith("/auth/login") || pathname.startsWith("/auth/register")) {
          return true
        }
        
        // Block debug routes in production
        if (pathname.startsWith("/debug")) {
          return process.env.NODE_ENV !== "production"
        }
        
        // Admin routes require admin role and active status
        if (pathname.startsWith("/admin")) {
          const isAdmin = token?.role === "ADMIN"
          const isActive = token?.status === "ACTIVE" || !token?.status
          return isAdmin && isActive
        }
        
        // Protected routes require authentication
        if (
          pathname.startsWith("/profile") ||
          pathname.startsWith("/orders") ||
          pathname.startsWith("/checkout")
        ) {
          return !!token
        }
        
        // Public routes
        return true
      },
    },
  }
)

export const config = {
  matcher: [
    "/admin/:path*",
    "/profile/:path*",
    "/orders/:path*",
    "/checkout/:path*",
    "/auth/:path*",
    "/debug/:path*",
    "/api/:path*"
  ]
}