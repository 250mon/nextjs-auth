import { NextRequest, NextResponse } from "next/server";
import { verifyApiToken } from "@/app/lib/jwt-service";
import { query } from "@/app/lib/db";
import { addCorsHeaders } from "@/app/lib/api-middleware";

export async function GET(request: NextRequest) {
  try {
    const origin = request.headers.get("origin");
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      const response = NextResponse.json(
        { success: false, error: "Authorization header required" },
        { status: 401 }
      );
      return addCorsHeaders(response, origin || undefined);
    }

    const token = authHeader.substring(7);
    const payload = await verifyApiToken(token);
    
    if (!payload) {
      const response = NextResponse.json(
        { success: false, error: "Invalid or expired token" },
        { status: 401 }
      );
      return addCorsHeaders(response, origin || undefined);
    }

    // Ensure token has expiration time
    if (!payload.exp) {
      const response = NextResponse.json(
        { success: false, error: "Token missing expiration time" },
        { status: 401 }
      );
      return addCorsHeaders(response, origin || undefined);
    }

    // Get fresh user data from database
    const userResult = await query(
      "SELECT id, name, email, isadmin, slug, active FROM users WHERE id = $1",
      [payload.id]
    );

    if (userResult.rows.length === 0) {
      const response = NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
      return addCorsHeaders(response, origin || undefined);
    }

    const user = userResult.rows[0];

    if (!user.active) {
      const response = NextResponse.json(
        { success: false, error: "User account is inactive" },
        { status: 403 }
      );
      return addCorsHeaders(response, origin || undefined);
    }

    // Return user data
    const response = NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          isadmin: user.isadmin,
          slug: user.slug,
        },
        token: {
          valid: true,
          expiresAt: new Date(payload.exp * 1000).toISOString(),
        },
      },
    });
    return addCorsHeaders(response, origin || undefined);

  } catch (error) {
    console.error("Token verification error:", error);
    const response = NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
    return addCorsHeaders(response, request.headers.get("origin") || undefined);
  }
}
