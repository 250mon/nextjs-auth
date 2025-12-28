import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adaptZodError } from "@/app/lib/zod-error-adaptor";
import bcrypt from "bcryptjs";
import { query, ensureApiRefreshTokensTable } from "@/app/lib/db";
import { generateApiToken, generateRefreshToken } from "@/app/lib/jwt-service";
import { addCorsHeaders } from "@/app/lib/api-middleware";
import type { User } from "@/app/lib/definitions";

// Login schema
const loginSchema = z.object({
  email: z
    .string({ error: "Email is required" })
    .min(1, "Email required")
    .email("Invalid email"),
  password: z
    .string({ error: "Password is required" })
    .min(6, "Password must be more than 6 characters")
    .max(32, "Password must be less than 32 characters"),
});

async function getUser(email: string): Promise<User | undefined> {
  try {
    // Normalize email to lowercase for case-insensitive lookup
    const normalizedEmail = email.toLowerCase().trim();
    const result = await query("SELECT * FROM users WHERE LOWER(email) = LOWER($1) AND active = true", [normalizedEmail]);
    return result.rows[0] as User;
  } catch (error) {
    console.error("Failed to fetch user:", error);
    return undefined;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const origin = request.headers.get("origin");
    
    // Validate input
    const parsedCredentials = loginSchema.safeParse(body);
    if (!parsedCredentials.success) {
      const adapted = adaptZodError(parsedCredentials.error);
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

    const { email, password } = parsedCredentials.data;

    // Get user from database
    const user = await getUser(email);
    if (!user) {
      const response = NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
      return addCorsHeaders(response, origin || undefined);
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      const response = NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
      return addCorsHeaders(response, origin || undefined);
    }

    // Generate tokens
    const accessToken = await generateApiToken({
      id: user.id,
      email: user.email,
      name: user.name,
      isadmin: user.isadmin,
      is_super_admin: user.is_super_admin,
      company_id: user.company_id,
    });

    const refreshToken = await generateRefreshToken({
      id: user.id,
      email: user.email,
    });

    // Ensure api_refresh_tokens table exists before using it
    await ensureApiRefreshTokensTable();

    // Store refresh token in database
    await query(
      "INSERT INTO api_refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3) ON CONFLICT (user_id) DO UPDATE SET token = $2, expires_at = $3",
      [user.id, refreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)] // 7 days
    );

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
          refreshToken,
          expiresIn: 3600, // 1 hour
        },
      },
    });
    return addCorsHeaders(response, origin || undefined);

  } catch (error) {
    console.error("Login error:", error);
    
    // Handle specific error types
    let errorMessage = "Internal server error";
    let statusCode = 500;
    
    if (error instanceof Error) {
      // Check for database connection errors
      if (error.message.includes("connect") || error.message.includes("ECONNREFUSED")) {
        errorMessage = "Database connection failed";
        statusCode = 503;
      } else if (error.message.includes("timeout")) {
        errorMessage = "Request timeout";
        statusCode = 504;
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
