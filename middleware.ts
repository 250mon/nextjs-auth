import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { handleCors, addCorsHeaders } from "@/app/lib/api-middleware";
import { basePath, createBasePathRelativeUrl } from "@/app/lib/utils";

// 1. Specify protected and public routes
const protectedRoutes = ["/dashboard"];
const publicRoutes = ["/login", "/register", "/"];
const CHANGE_PASSWORD_ROUTE = "/dashboard/change-password";

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
  // Behind a reverse proxy (e.g. Caddy) that terminates TLS, the connection to
  // this container is plain HTTP, so req.nextUrl.protocol is "http:" even
  // though the browser is on https. Auth.js core respects AUTH_TRUST_HOST and
  // reads x-forwarded-proto to detect https, which is what determines whether
  // it names the session cookie with the `__Secure-` prefix. getToken() does
  // NOT do this detection itself (its secureCookie param defaults to false),
  // so it must be told explicitly or it'll look for the wrong cookie name and
  // never find a session set behind TLS termination.
  const isSecure =
    req.headers.get("x-forwarded-proto") === "https" ||
    req.nextUrl.protocol === "https:";
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
    secureCookie: isSecure,
  });

  // Same reverse-proxy blind spot applies to building redirect URLs below:
  // req.nextUrl's origin reflects the internal connection Caddy makes to this
  // container (host:3000), not the https origin the browser actually used.
  // Rebuild the origin from the forwarded headers so redirect Location headers
  // come out clean. Note: assigning to url.host/url.hostname does NOT clear a
  // pre-existing port when the new value has none (verified: `new
  // URL("https://internal:3000/x").host = "public.example"` stays ":3000"),
  // so mutating req.nextUrl in place silently leaked the internal port into
  // every redirect built this way. Constructing a fresh URL avoids that.
  const forwardedHost = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const protocol = isSecure ? "https:" : "http:";
  const externalUrl = new URL(
    `${protocol}//${forwardedHost ?? req.nextUrl.host}${req.nextUrl.pathname}${req.nextUrl.search}`,
  );

  // 4. Redirect to /login if the user is not authenticated
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(createBasePathRelativeUrl("/login", externalUrl));
  }

  // 5. Redirect to /dashboard if the user is authenticated
  if (isPublicRoute && token && !req.nextUrl.pathname.startsWith("/dashboard")) {
    const destination = token.mustChangePassword ? CHANGE_PASSWORD_ROUTE : "/dashboard";
    return NextResponse.redirect(createBasePathRelativeUrl(destination, externalUrl));
  }

  // 6. Force a password change before allowing access to any other protected
  // route (e.g. a bootstrap-created admin account logging in for the first time).
  if (isProtectedRoute && token?.mustChangePassword && path !== CHANGE_PASSWORD_ROUTE) {
    return NextResponse.redirect(createBasePathRelativeUrl(CHANGE_PASSWORD_ROUTE, externalUrl));
  }

  return NextResponse.next();
}

// Routes Middleware should run on
export const config = {
  matcher: [
    // API routes for CORS handling
    "/api/(.*)",
    // Page routes for authentication
    // Exclude static files, Next.js internals, and common image/file types
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|eot|css|js)$).*)"
  ],
};
