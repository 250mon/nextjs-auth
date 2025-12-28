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
      "SELECT id, name, email, isadmin, is_super_admin, company_id, slug FROM users WHERE id = $1 AND active = true",
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

    // Get company information if user has a company
    let company = null;
    if (user.company_id) {
      const companyResult = await query(
        "SELECT id, name, description FROM companies WHERE id = $1",
        [user.company_id]
      );
      if (companyResult.rows.length > 0) {
        company = {
          id: companyResult.rows[0].id,
          name: companyResult.rows[0].name,
          description: companyResult.rows[0].description,
        };
      }
    }

    // Generate new access token
    const accessToken = await generateApiToken({
      id: user.id,
      email: user.email,
      name: user.name,
      isadmin: user.isadmin,
      is_super_admin: user.is_super_admin,
      company_id: user.company_id,
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
          is_super_admin: user.is_super_admin,
          company_id: user.company_id,
          slug: user.slug,
          company: company,
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
    
    // Handle specific error types
    let errorMessage = "Internal server error";
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes("connect") || error.message.includes("ECONNREFUSED")) {
        errorMessage = "Database connection failed";
        statusCode = 503;
      } else if (error.message.includes("timeout")) {
        errorMessage = "Request timeout";
        statusCode = 504;
      } else if (error.message.includes("jwt") || error.message.includes("token")) {
        errorMessage = "Token processing error";
        statusCode = 401;
      }
    }
    
    const response = NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        ...(process.env.NODE_ENV === 'development' && { 
          details: error instanceof Error ? error.message : String(error) 
        })
      },
      { status: statusCode }
    );
    return addCorsHeaders(response, request.headers.get("origin") || undefined);
  }
}
