import { NextRequest, NextResponse } from "next/server";
import { apiMiddleware, addCorsHeaders } from "@/app/lib/api-middleware";
import { query } from "@/app/lib/db";
import { z } from "zod";
import bcrypt from "bcryptjs";

// Schema for self password change
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters").max(100),
});

/**
 * PUT /api/v1/users/me/password
 * User changes their own password
 * Requires authentication
 */
export async function PUT(request: NextRequest) {
  const middlewareResult = await apiMiddleware(request, { requireAuth: true });

  if (!middlewareResult.success) {
    return middlewareResult.response!;
  }

  if (!middlewareResult.user) {
    const response = NextResponse.json(
      { success: false, error: "User not found" },
      { status: 404 }
    );
    return addCorsHeaders(response);
  }

  const origin = request.headers.get("origin");

  try {
    const body = await request.json();

    // Validate input
    const parseResult = changePasswordSchema.safeParse(body);
    if (!parseResult.success) {
      const response = NextResponse.json(
        {
          success: false,
          error: "Invalid input",
          details: {
            fieldErrors: parseResult.error.flatten().fieldErrors,
          }
        },
        { status: 400 }
      );
      return addCorsHeaders(response, origin || undefined);
    }

    const { currentPassword, newPassword } = parseResult.data;

    // Get user's current password hash
    const userResult = await query(
      "SELECT password FROM users WHERE id = $1",
      [middlewareResult.user.id]
    );

    if (userResult.rows.length === 0) {
      const response = NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
      return addCorsHeaders(response, origin || undefined);
    }

    // Verify current password
    const passwordMatch = await bcrypt.compare(currentPassword, userResult.rows[0].password);
    if (!passwordMatch) {
      const response = NextResponse.json(
        { success: false, error: "Current password is incorrect" },
        { status: 401 }
      );
      return addCorsHeaders(response, origin || undefined);
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear must_change_password flag
    await query(
      `UPDATE users
       SET password = $1, must_change_password = false, updated_at = NOW()
       WHERE id = $2`,
      [hashedPassword, middlewareResult.user.id]
    );

    const response = NextResponse.json({
      success: true,
      message: "Password changed successfully",
    });

    return addCorsHeaders(response, origin || undefined);

  } catch (error) {
    console.error("Change password error:", error);
    const response = NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
    return addCorsHeaders(response, origin || undefined);
  }
}

/**
 * Handle CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response, origin || undefined);
}
