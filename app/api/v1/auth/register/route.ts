import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adaptZodError } from "@/app/lib/zod-error-adaptor";
import bcrypt from "bcryptjs";
import { query } from "@/app/lib/db";
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

    // Check if user already exists
    const existingUser = await query("SELECT id FROM users WHERE email = $1", [email]);
    if (existingUser.rows.length > 0) {
      const response = NextResponse.json(
        { success: false, error: "User with this email already exists" },
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

    // Insert user
    const userResult = await query(
      `INSERT INTO users (name, email, password, slug, isadmin, active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING id, name, email, isadmin, slug`,
      [name, email, hashedPassword, slug, false, true]
    );

    const newUser = userResult.rows[0];

    // Generate tokens
    const accessToken = await generateApiToken({
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      isadmin: newUser.isadmin,
    });

    const refreshToken = await generateRefreshToken({
      id: newUser.id,
      email: newUser.email,
    });

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
          slug: newUser.slug,
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
    const response = NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
    return addCorsHeaders(response, request.headers.get("origin") || undefined);
  }
}
