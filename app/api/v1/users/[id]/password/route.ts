import { NextRequest, NextResponse } from "next/server";
import { apiMiddleware, addCorsHeaders } from "@/app/lib/api-middleware";
import { query } from "@/app/lib/db";
import { z } from "zod";
import bcrypt from "bcryptjs";

// Schema for admin password reset
const adminResetPasswordSchema = z.object({
  newPassword: z.string().min(6, "Password must be at least 6 characters").max(100),
  requireChange: z.boolean().optional().default(true),
});

/**
 * PUT /api/v1/users/[id]/password
 * Admin resets another user's password
 * Requires admin or super admin token
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const middlewareResult = await apiMiddleware(request, { requireAdmin: true });

  if (!middlewareResult.success) {
    return middlewareResult.response!;
  }

  const { id: targetUserId } = await params;
  const origin = request.headers.get("origin");

  try {
    const body = await request.json();

    // Validate input
    const parseResult = adminResetPasswordSchema.safeParse(body);
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

    const { newPassword, requireChange } = parseResult.data;

    // Check if target user exists
    const userCheck = await query("SELECT id, company_id FROM users WHERE id = $1", [targetUserId]);
    if (userCheck.rows.length === 0) {
      const response = NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
      return addCorsHeaders(response, origin || undefined);
    }

    const targetUser = userCheck.rows[0];

    // Security check: Admin can only reset passwords for users in their own company
    // Super admins can reset any user's password
    if (!middlewareResult.user?.is_super_admin) {
      if (targetUser.company_id !== middlewareResult.user?.company_id) {
        const response = NextResponse.json(
          { success: false, error: "Cannot reset password for users in other companies" },
          { status: 403 }
        );
        return addCorsHeaders(response, origin || undefined);
      }
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user's password and must_change_password flag
    await query(
      `UPDATE users
       SET password = $1, must_change_password = $2, updated_at = NOW()
       WHERE id = $3`,
      [hashedPassword, requireChange, targetUserId]
    );

    const response = NextResponse.json({
      success: true,
      message: "Password reset successfully",
      data: {
        must_change_password: requireChange,
      },
    });

    return addCorsHeaders(response, origin || undefined);

  } catch (error) {
    console.error("Admin password reset error:", error);
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
