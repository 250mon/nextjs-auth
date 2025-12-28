import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adaptZodError } from "@/app/lib/zod-error-adaptor";
import bcrypt from "bcryptjs";
import { query, ensureApiRefreshTokensTable } from "@/app/lib/db";
import { generateApiToken, generateRefreshToken } from "@/app/lib/jwt-service";
import { addCorsHeaders } from "@/app/lib/api-middleware";

// Register schema
const registerSchema = z
  .object({
    email: z
      .string({ error: "Email is required" })
      .min(1, "Email required")
      .email("Invalid email"),
    password: z
      .string({ error: "Password is required" })
      .min(6, "Password must be more than 6 characters")
      .max(32, "Password must be less than 32 characters"),
    name: z
      .string({ error: "Name is required" })
      .min(3, "Name must be more than 3 characters")
      .max(100, "Name must be less than 100 characters"),
    confirm_password: z
      .string({ error: "Please confirm your password" })
      .min(6, "Password must be more than 6 characters")
      .max(32, "Password must be less than 32 characters"),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords must match",
    path: ["confirm_password"],
  });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const origin = request.headers.get("origin");
    
    // Validate input
    const parsedCredentials = registerSchema.safeParse(body);
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

    const { email, password, name } = parsedCredentials.data;

    // Normalize email to lowercase for consistency
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists (case-insensitive check)
    const existingUser = await query(
      "SELECT id FROM users WHERE LOWER(email) = LOWER($1)",
      [normalizedEmail]
    );
    if (existingUser.rows.length > 0) {
      const response = NextResponse.json(
        { 
          success: false, 
          error: "User with this email already exists",
          details: {
            fieldErrors: {
              email: ["An account with this email address already exists"]
            }
          }
        },
        { status: 409 }
      );
      return addCorsHeaders(response, origin || undefined);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate unique slug
    const baseSlug = name
      .toLowerCase()
      .replace(/\s+/g, "-");
    const uniqueId = Math.random().toString(36).substring(2, 8);
    const slug = `${baseSlug}-${uniqueId}`;

    // Insert user (use normalized email)
    let userResult;
    try {
      userResult = await query(
        `INSERT INTO users (name, email, password, slug, isadmin, is_super_admin, active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
         RETURNING id, name, email, isadmin, is_super_admin, company_id, slug`,
        [name, normalizedEmail, hashedPassword, slug, false, false, true]
      );
    } catch (dbError: unknown) {
      // Handle unique constraint violations (e.g., email or slug already exists)
      if (dbError && typeof dbError === 'object' && 'code' in dbError && dbError.code === '23505') { // PostgreSQL unique violation
        // Determine which constraint was violated
        const constraintName = ('constraint' in dbError && typeof dbError.constraint === 'string') ? dbError.constraint : '';
        const errorDetail = ('detail' in dbError && typeof dbError.detail === 'string') ? dbError.detail : '';
        const isEmailConflict = constraintName.toLowerCase().includes('email') || 
                                 errorDetail.toLowerCase().includes('email');
        const isSlugConflict = constraintName.toLowerCase().includes('slug') || 
                               errorDetail.toLowerCase().includes('slug');
        
        const fieldErrors: Record<string, string[]> = {};
        let errorMessage = "User with this email or slug already exists";
        
        if (isEmailConflict) {
          fieldErrors.email = ["An account with this email address already exists"];
          errorMessage = "User with this email already exists";
        }
        if (isSlugConflict) {
          fieldErrors.slug = ["A user with this slug already exists"];
          if (!isEmailConflict) {
            errorMessage = "User with this slug already exists";
          }
        }
        
        const response = NextResponse.json(
          { 
            success: false, 
            error: errorMessage,
            details: {
              fieldErrors: Object.keys(fieldErrors).length > 0 ? fieldErrors : {
                email: ["An account with this email address already exists"]
              }
            }
          },
          { status: 409 }
        );
        return addCorsHeaders(response, origin || undefined);
      }
      // Re-throw other database errors
      throw dbError;
    }

    const newUser = userResult.rows[0];

    // Get company information if user has a company
    let company = null;
    if (newUser.company_id) {
      const companyResult = await query(
        "SELECT id, name, description FROM companies WHERE id = $1",
        [newUser.company_id]
      );
      if (companyResult.rows.length > 0) {
        company = {
          id: companyResult.rows[0].id,
          name: companyResult.rows[0].name,
          description: companyResult.rows[0].description,
        };
      }
    }

    // Generate tokens
    const accessToken = await generateApiToken({
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      isadmin: newUser.isadmin,
      is_super_admin: newUser.is_super_admin,
      company_id: newUser.company_id,
    });

    const refreshToken = await generateRefreshToken({
      id: newUser.id,
      email: newUser.email,
    });

    // Ensure api_refresh_tokens table exists before using it
    await ensureApiRefreshTokensTable();

    // Store refresh token in database
    await query(
      "INSERT INTO api_refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)",
      [newUser.id, refreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)] // 7 days
    );

    // Return success response
    const response = NextResponse.json({
      success: true,
      data: {
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          isadmin: newUser.isadmin,
          is_super_admin: newUser.is_super_admin,
          company_id: newUser.company_id,
          slug: newUser.slug,
          company: company,
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: 3600, // 1 hour
        },
      },
    }, { status: 201 });
    return addCorsHeaders(response, origin || undefined);

  } catch (error) {
    console.error("Registration error:", error);
    
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
