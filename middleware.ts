import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { handleCors, addCorsHeaders } from "@/app/lib/api-middleware";

// Get basePath from environment variable
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

// Helper function to create URL with basePath
function createUrl(path: string, baseUrl: URL): URL {
  const pathWithBase = basePath ? `${basePath}${path}` : path;
  return new URL(pathWithBase, baseUrl);
}

// 1. Specify protected and public routes
const protectedRoutes = ["/dashboard"];
const publicRoutes = ["/login", "/register", "/"];

export default async function middleware(req: NextRequest) {
  // 2. Check if the current route is protected or public
  // Remove basePath from pathname for route matching
  const pathname = req.nextUrl.pathname;
  const path = basePath && pathname.startsWith(basePath) 
    ? pathname.slice(basePath.length) || '/' 
    : pathname; 

  // Handle CORS for API routes
  if (path.startsWith("/api/")) {
    // Handle CORS preflight requests
    const corsResponse = handleCors(req);
    if (corsResponse) {
      return corsResponse;
    }
    
    // For non-preflight API requests, continue to the handler
    // CORS headers will be added by the API route handlers
    return NextResponse.next();
  }

  const isProtectedRoute = protectedRoutes.includes(path) || path.startsWith("/dashboard/");
  const isPublicRoute = publicRoutes.includes(path);

  // 3. Get the NextAuth session token
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });

  // 4. Redirect to /login if the user is not authenticated
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(createUrl("/login", req.nextUrl));
  }

  // 5. Redirect to /dashboard if the user is authenticated
  if (isPublicRoute && token && !req.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(createUrl("/dashboard", req.nextUrl));
  }

  return NextResponse.next();
}

// Routes Middleware should run on
export const config = {
  matcher: [
    // API routes for CORS handling
    "/api/(.*)",
    // Page routes for authentication
    "/((?!_next/static|_next/image|.*\\.png$).*)"
  ],
};
