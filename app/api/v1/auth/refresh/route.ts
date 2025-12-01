import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adaptZodError } from "@/app/lib/zod-error-adaptor";
import { query, ensureApiRefreshTokensTable } from "@/app/lib/db";
import { verifyRefreshToken, generateApiToken } from "@/app/lib/jwt-service";
import { addCorsHeaders } from "@/app/lib/api-middleware";

// Refresh token schema
const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const origin = request.headers.get("origin");
    
    // Validate input
    const parsedData = refreshSchema.safeParse(body);
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

    // Verify refresh token
    const payload = await verifyRefreshToken(refreshToken);
    if (!payload) {
      const response = NextResponse.json(
        { success: false, error: "Invalid or expired refresh token" },
        { status: 401 }
      );
      return addCorsHeaders(response, origin || undefined);
    }

    // Ensure api_refresh_tokens table exists before using it
    await ensureApiRefreshTokensTable();

    // Check if refresh token exists in database and is not expired
    const tokenResult = await query(
      "SELECT user_id FROM api_refresh_tokens WHERE token = $1 AND expires_at > NOW()",
      [refreshToken]
    );

    if (tokenResult.rows.length === 0) {
      const response = NextResponse.json(
        { success: false, error: "Invalid or expired refresh token" },
        { status: 401 }
      );
      return addCorsHeaders(response, origin || undefined);
    }

    // Get user data
    const userResult = await query(
      "SELECT id, name, email, isadmin, slug FROM users WHERE id = $1 AND active = true",
      [payload.id]
    );

    if (userResult.rows.length === 0) {
      const response = NextResponse.json(
        { success: false, error: "User not found or inactive" },
        { status: 404 }
      );
      return addCorsHeaders(response, origin || undefined);
    }

    const user = userResult.rows[0];

    // Generate new access token
    const accessToken = await generateApiToken({
      id: user.id,
      email: user.email,
      name: user.name,
      isadmin: user.isadmin,
    });

    // Return success response
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
        tokens: {
          accessToken,
          expiresIn: 3600, // 1 hour
        },
      },
    });
    return addCorsHeaders(response, origin || undefined);

  } catch (error) {
    console.error("Token refresh error:", error);
    const response = NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
    return addCorsHeaders(response, request.headers.get("origin") || undefined);
  }
}
