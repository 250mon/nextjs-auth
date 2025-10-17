import { NextRequest, NextResponse } from "next/server";
import { verifyApiToken } from "@/app/lib/jwt-service";
import { query } from "@/app/lib/db";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Authorization header required" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = await verifyApiToken(token);
    
    if (!payload) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // Get fresh user data from database
    const userResult = await query(
      "SELECT id, name, email, isadmin, slug, active FROM users WHERE id = $1",
      [payload.id]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const user = userResult.rows[0];

    if (!user.active) {
      return NextResponse.json(
        { success: false, error: "User account is inactive" },
        { status: 403 }
      );
    }

    // Return user data
    return NextResponse.json({
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

  } catch (error) {
    console.error("Token verification error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
