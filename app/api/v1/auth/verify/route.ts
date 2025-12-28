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
      "SELECT id, name, email, isadmin, is_super_admin, company_id, slug, active FROM users WHERE id = $1",
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

    // Return user data
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
        token: {
          valid: true,
          expiresAt: new Date(payload.exp * 1000).toISOString(),
        },
      },
    });
    return addCorsHeaders(response, origin || undefined);

  } catch (error) {
    console.error("Token verification error:", error);
    
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
