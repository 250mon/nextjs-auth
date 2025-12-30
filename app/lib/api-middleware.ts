import { NextRequest, NextResponse } from "next/server";
import { verifyApiToken, extractTokenFromHeader, TokenPayload } from "./jwt-service";

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = 100; // 100 requests per window

/**
 * Rate limiting middleware
 */
export function rateLimit(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const key = `rate_limit:${identifier}`;
  
  const current = rateLimitStore.get(key);
  
  if (!current || now > current.resetTime) {
    // Reset or create new entry
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    
    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX_REQUESTS - 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    };
  }
  
  if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: current.resetTime,
    };
  }
  
  // Increment counter
  current.count++;
  rateLimitStore.set(key, current);
  
  return {
    allowed: true,
    remaining: RATE_LIMIT_MAX_REQUESTS - current.count,
    resetTime: current.resetTime,
  };
}

/**
 * Get client identifier for rate limiting
 */
function getClientIdentifier(request: NextRequest): string {
  // Try to get IP from various headers
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  
  const ip = forwarded?.split(",")[0] || realIp || cfConnectingIp || "unknown";
  return ip;
}

/**
 * CORS headers
 */
export function getCorsHeaders(origin?: string): Record<string, string> {
  // Get allowed origins from environment variable
  const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : ['http://localhost:3000', 'http://localhost:3001'];


  // Check if wildcard is explicitly set
  const allowAllOrigins = allowedOrigins.includes('*');
  
  // Base CORS headers
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Accept, Origin",
    "Access-Control-Max-Age": "86400", // 24 hours
    "Access-Control-Expose-Headers": "X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset",
  };

  // Determine the origin to allow
  if (allowAllOrigins) {
    // If '*' is explicitly in ALLOWED_ORIGINS, allow all origins
    // Note: Cannot use '*' with credentials, so we must use the actual origin if provided
    if (origin) {
      headers["Access-Control-Allow-Origin"] = origin;
      headers["Access-Control-Allow-Credentials"] = "true";
    } else {
      // No origin header (e.g., same-origin or non-browser client)
      headers["Access-Control-Allow-Origin"] = '*';
      headers["Access-Control-Allow-Credentials"] = "false"; // Can't use credentials with '*'
    }
  } else if (origin && allowedOrigins.includes(origin)) {
    // Origin is in the allowed list - allow it
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Credentials"] = "true";
  } else if (origin) {
    // Origin is provided but NOT in the allowed list - reject by not setting Access-Control-Allow-Origin
    // This will cause the browser to block the CORS request
    // Still return other headers for consistency
    headers["Access-Control-Allow-Credentials"] = "true";
    // Intentionally NOT setting Access-Control-Allow-Origin to block the request
  } else {
    // No origin header - this is normal for:
    // - Same-origin requests (browser doesn't send Origin for same-origin)
    // - Server-side requests (backend-to-backend)
    // - Non-browser clients
    // For these cases, we should allow the request since CORS doesn't apply
    // Use the first allowed origin as a fallback, or allow all if configured
    if (allowedOrigins.length > 0) {
      headers["Access-Control-Allow-Origin"] = allowedOrigins[0];
      headers["Access-Control-Allow-Credentials"] = "true";
    } else {
      // No allowed origins configured - allow all (fallback)
      headers["Access-Control-Allow-Origin"] = '*';
      headers["Access-Control-Allow-Credentials"] = "false";
    }
  }

  return headers;
}

/**
 * Handle CORS preflight requests
 */
export function handleCors(request: NextRequest): NextResponse | null {
  if (request.method === "OPTIONS") {
    const origin = request.headers.get("origin");
    const corsHeaders = getCorsHeaders(origin || undefined);
    return new NextResponse(null, {
      status: 200,
      headers: corsHeaders,
    });
  }
  return null;
}

/**
 * Authentication middleware
 */
export async function authenticateRequest(request: NextRequest): Promise<{
  success: boolean;
  user?: TokenPayload;
  error?: string;
  status?: number;
}> {
  try {
    const authHeader = request.headers.get("authorization");
    const token = extractTokenFromHeader(authHeader);
    
    if (!token) {
      return {
        success: false,
        error: "Authorization header required",
        status: 401,
      };
    }
    
    const payload = await verifyApiToken(token);
    if (!payload) {
      return {
        success: false,
        error: "Invalid or expired token",
        status: 401,
      };
    }
    
    return {
      success: true,
      user: payload,
    };
  } catch (error) {
    console.error("Authentication error:", error);
    return {
      success: false,
      error: "Authentication failed",
      status: 500,
    };
  }
}

/**
 * Admin authorization middleware
 */
export async function requireAdmin(request: NextRequest): Promise<{
  success: boolean;
  user?: TokenPayload;
  error?: string;
  status?: number;
}> {
  const authResult = await authenticateRequest(request);
  
  if (!authResult.success) {
    return authResult;
  }
  
  if (!authResult.user?.isadmin) {
    return {
      success: false,
      error: "Admin access required",
      status: 403,
    };
  }
  
  return authResult;
}

/**
 * Super Admin authorization middleware
 */
export async function requireSuperAdmin(request: NextRequest): Promise<{
  success: boolean;
  user?: TokenPayload;
  error?: string;
  status?: number;
}> {
  const authResult = await authenticateRequest(request);
  
  if (!authResult.success) {
    return authResult;
  }
  
  if (!authResult.user?.is_super_admin) {
    return {
      success: false,
      error: "Super Admin access required",
      status: 403,
    };
  }
  
  return authResult;
}

/**
 * Complete API middleware that handles CORS, rate limiting, and authentication
 */
export async function apiMiddleware(
  request: NextRequest,
  options: {
    requireAuth?: boolean;
    requireAdmin?: boolean;
    requireSuperAdmin?: boolean;
    skipRateLimit?: boolean;
  } = {}
): Promise<{
  success: boolean;
  response?: NextResponse;
  user?: TokenPayload;
  error?: string;
}> {
  // Handle CORS
  const corsResponse = handleCors(request);
  if (corsResponse) {
    return { success: true, response: corsResponse };
  }
  
  // Rate limiting
  if (!options.skipRateLimit) {
    const clientId = getClientIdentifier(request);
    const rateLimitResult = rateLimit(clientId);
    
    if (!rateLimitResult.allowed) {
      const response = NextResponse.json(
        {
          success: false,
          error: "Rate limit exceeded",
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
        },
        { status: 429 }
      );
      
      // Add rate limit headers
      response.headers.set("X-RateLimit-Limit", RATE_LIMIT_MAX_REQUESTS.toString());
      response.headers.set("X-RateLimit-Remaining", "0");
      response.headers.set("X-RateLimit-Reset", new Date(rateLimitResult.resetTime).toISOString());
      response.headers.set("Retry-After", Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString());
      
      return { success: true, response };
    }
  }
  
  // Authentication
  if (options.requireAuth || options.requireAdmin || options.requireSuperAdmin) {
    let authResult;
    if (options.requireSuperAdmin) {
      authResult = await requireSuperAdmin(request);
    } else if (options.requireAdmin) {
      authResult = await requireAdmin(request);
    } else {
      authResult = await authenticateRequest(request);
    }
    
    if (!authResult.success) {
      const response = NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status || 401 }
      );
      return { success: false, response };
    }
    
    return { success: true, user: authResult.user };
  }
  
  return { success: true };
}

/**
 * Add CORS headers to response
 */
export function addCorsHeaders(response: NextResponse, origin?: string): NextResponse {
  const corsHeaders = getCorsHeaders(origin);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}
