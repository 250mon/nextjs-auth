import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adaptZodError } from "@/app/lib/zod-error-adaptor";
import { query } from "@/app/lib/db";
import { verifyApiToken, verifyRefreshToken } from "@/app/lib/jwt-service";
import { addCorsHeaders } from "@/app/lib/api-middleware";

// Logout schema
const logoutSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const origin = request.headers.get("origin");
    
    // Validate input
    const parsedData = logoutSchema.safeParse(body);
    if (!parsedData.success) {
      const adapted = adaptZodError(parsedData.error);
      const response = NextResponse.json(
        { 
          success: false, 
          error: "Invalid input", 
          details: {
            formErrors: adapted.formErrors,
            fieldErrors: adapted.fieldErrorsAll,
          }
        },
        { status: 400 }
      );
      return addCorsHeaders(response, origin || undefined);
    }

    const { refreshToken } = parsedData.data;

    // Verify refresh token to get user ID
    const payload = await verifyRefreshToken(refreshToken);
    if (!payload) {
      const response = NextResponse.json(
        { success: false, error: "Invalid refresh token" },
        { status: 401 }
      );
      return addCorsHeaders(response, origin || undefined);
    }

    // Remove refresh token from database
    await query(
      "DELETE FROM api_refresh_tokens WHERE token = $1",
      [refreshToken]
    );

    // Return success response
    const response = NextResponse.json({
      success: true,
      message: "Successfully logged out",
    });
    return addCorsHeaders(response, origin || undefined);

  } catch (error) {
    console.error("Logout error:", error);
    const response = NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
    return addCorsHeaders(response, request.headers.get("origin") || undefined);
  }
}

// Also support logout with Authorization header
export async function DELETE(request: NextRequest) {
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
        { success: false, error: "Invalid token" },
        { status: 401 }
      );
      return addCorsHeaders(response, origin || undefined);
    }

    // Remove all refresh tokens for this user
    await query(
      "DELETE FROM api_refresh_tokens WHERE user_id = $1",
      [payload.id]
    );

    const response = NextResponse.json({
      success: true,
      message: "Successfully logged out",
    });
    return addCorsHeaders(response, origin || undefined);

  } catch (error) {
    console.error("Logout error:", error);
    const response = NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
    return addCorsHeaders(response, request.headers.get("origin") || undefined);
  }
}
